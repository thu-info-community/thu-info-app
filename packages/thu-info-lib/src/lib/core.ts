import {
    CONFIRM_LOGIN_URL,
    DO_LOGIN_URL,
    DORM_LOGIN_URL_PREFIX,
    DORM_SCORE_REFERER,
    DORM_SCORE_URL,
    INFO_LOGIN_URL,
    INFO_ROOT_URL,
    INFO_URL,
    LIBRARY_ROOM_BOOKING_LOGIN_REFERER,
    LIBRARY_ROOM_BOOKING_LOGIN_URL,
    LOGIN_URL,
    LOGOUT_URL,
    META_DATA_URL,
    TSINGHUA_HOME_LOGIN_URL,
    WEB_VPN_ROOT_URL,
    GET_COOKIE_URL,
    ID_LOGIN_URL,
    ID_BASE_URL,
    USER_DATA_URL,
    ROAMING_URL,
} from "../constants/strings";
import md5 from "md5";
import cheerio from "cheerio";
import {InfoHelper} from "../index";
import {clearCookies, ValidTickets} from "../utils/network";
import {uFetch} from "../utils/network";
import {IdAuthError, UrlError} from "../utils/error";

type RoamingPolicy = "default" | "id" | "cab";

const HOST_MAP: {[key: string]: string} = {
    "zhjw.cic": "77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290",
    "jxgl.cic": "77726476706e69737468656265737421faef469069336153301c9aa596522b20e33c1eb39606919f",
    "ecard": "77726476706e69737468656265737421f5f4408e237e7c4377068ea48d546d303341e9882a",
    "learn": "77726476706e69737468656265737421fcf2408e297e7c4377068ea48d546d30ca8cc97bcc",
    "50": "77726476706e69737468656265737421a5a70f8834396657761d88e29d51367b6a00",
};

const parseUrl = (urlIn: string) => {
    const protocol = urlIn.substring(0, urlIn.indexOf(":"));
    const regRes = /:\/\/(.+?).tsinghua.edu.cn\/(.+)/.exec(urlIn);
    if (regRes === null || regRes[1] === undefined || regRes[2] === undefined) {
        throw new UrlError();
    }
    const host = regRes[1];
    const path = regRes[2];
    return `https://webvpn.tsinghua.edu.cn/${protocol}/${HOST_MAP[host]}/${path}`;
};

const getCsrfToken = async () => {
    const cookie = await uFetch(GET_COOKIE_URL);
    const q = /XSRF-TOKEN=(.+?);/.exec(cookie + ";");
    if (q === null || q[1] === undefined) {
        throw new Error("Failed to get csrf token.");
    }
    return q[1];
};

const loginInfo = async (
    helper: InfoHelper,
    userId: string,
    password: string,
    indicator?: () => void,
) => {
    const response = await uFetch(
        INFO_LOGIN_URL,
        INFO_URL,
        {
            redirect: "NO",
            userName: userId,
            password: password,
            x: "0",
            y: "0",
        },
    );
    if (!response.includes("清华大学信息门户")) {
        throw new Error("Failed to login to INFO.");
    }
    await uFetch(INFO_ROOT_URL, INFO_URL);
    try {
        const {config} = await uFetch(
            META_DATA_URL,
            INFO_ROOT_URL,
            undefined,
            2000,
        ).then(JSON.parse);
        helper.emailName = config.userInfo.yhm;
        helper.fullName = config.userInfo.userName;
    } catch {
        throw new Error("Failed to get meta data.");
    }
    indicator && indicator();
};

const loginInfo2021 = async (helper: InfoHelper) => {
    await roam(helper, "id", "10000ea055dd8d81d09d5a1ba55d39ad");
    try {
        const {object} = await uFetch(`${USER_DATA_URL}?_csrf=${await getCsrfToken()}`, undefined, {}).then(JSON.parse);
        // TODO: email name!
        helper.fullName = object.xm;
    } catch {
        throw new Error("Failed to get meta data.");
    }
};

/**
 * Logs-in to WebVPN, INFO and academic.
 */
export const login = async (
    helper: InfoHelper,
    userId: string,
    password: string,
    dormPassword: string,
    statusIndicator?: () => void,
): Promise<void> => {
    helper.userId = userId;
    helper.password = password;
    helper.dormPassword = dormPassword;
    if (helper.mocked() || helper.loginLocked) {
        return;
    }
    try {
        helper.loginLocked = true;
        clearCookies();
        await helper.clearCookieHandler();
        const loginResponse = await uFetch(DO_LOGIN_URL, LOGIN_URL, {
            auth_type: "local",
            username: userId,
            sms_code: "",
            password: password,
        }).then(JSON.parse);
        if (!loginResponse.success) {
            switch (loginResponse.error) {
            case "NEED_CONFIRM":
                await uFetch(CONFIRM_LOGIN_URL, LOGIN_URL, {});
                break;
            default:
                throw new Error(loginResponse.message);
            }
        }
        statusIndicator && statusIndicator();
        await Promise.all([
            loginInfo(helper, userId, password, statusIndicator),
            loginInfo2021(helper),
        ]);
        await batchGetTickets(
            helper,
            [-1, -2] as ValidTickets[],
            statusIndicator,
        );
    } finally {
        helper.loginLocked = false;
        // @ts-ignore
        if (global.FileReader) {
            // Do not keep-alive for Node.js
            keepAlive(helper);
        }
    }
};

/**
 * Logs-out from WebVPN.
 */
export const logout = async (helper: InfoHelper): Promise<void> => {
    if (!helper.mocked()) {
        await uFetch(LOGOUT_URL);
    }
};

export const roam = async (helper: InfoHelper, policy: RoamingPolicy, payload: string): Promise<void> => {
    switch (policy) {
    case "default": {
        const csrf = await getCsrfToken();
        const {object} = await uFetch(`${ROAMING_URL}?yyfwid=${payload}&_csrf=${csrf}&machine=p`, ROAMING_URL, {}).then(JSON.parse);
        const url = parseUrl(object.roamingurl.replace(/&amp;/g, "&"));
        await uFetch(url);
        break;
    }
    case "id": {
        await uFetch(ID_BASE_URL + payload);
        const response = await uFetch(
            ID_LOGIN_URL,
            ID_BASE_URL + payload,
            {
                i_user: helper.userId,
                i_pass: helper.password,
                i_captcha: "",
            },
        );
        if (!response.includes("登录成功")) {
            throw new IdAuthError();
        }
        const redirectUrl = cheerio("a", response).attr().href;
        await uFetch(redirectUrl, ID_LOGIN_URL);
        break;
    }
    case "cab": {
        await uFetch(LIBRARY_ROOM_BOOKING_LOGIN_URL, LIBRARY_ROOM_BOOKING_LOGIN_REFERER, {
            id: helper.userId,
            pwd: helper.password,
            act: "login",
        });
        break;
    }
    }
};

export const getTicket = async (helper: InfoHelper, target: ValidTickets): Promise<void> => {
    if (target === -1) {
        const userId = helper.userId;
        const appId = md5(userId + new Date().getTime());
        const url = DORM_LOGIN_URL_PREFIX + appId;
        await uFetch(url, url, {
            __VIEWSTATE: "/wEPDwUKLTEzNDQzMjMyOGRkBAc4N3HClJjnEWfrw0ASTb/U6Ev/SwndECOSr8NHmdI=",
            __VIEWSTATEGENERATOR: "7FA746C3",
            __EVENTVALIDATION: "/wEWBgK41bCLBQKPnvPTAwLXmu9LAvKJ/YcHAsSg1PwGArrUlUcttKZxxZPSNTWdfrBVquy6KRkUYY9npuyVR3kB+BCrnQ==",
            weixin_user_authenticateCtrl1$txtUserName: userId,
            weixin_user_authenticateCtrl1$txtPassword: helper.dormPassword || helper.password,
            weixin_user_authenticateCtrl1$btnLogin: "登录",
        });
        const response = await uFetch(DORM_SCORE_URL, DORM_SCORE_REFERER);
        if (cheerio("#weixin_health_linechartCtrl1_Chart1", response).length !== 1) {
            throw new Error("login to tsinghua home error");
        }
    } else if (target === -2) {
        const validChars = new Set(
            "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz =+-/_()<>,.'`~",
        );
        // TODO: these valid chars might be far from enough
        const {userId} = helper;
        const password = helper.dormPassword || helper.password;
        let tempPassword = "";
        for (let i = 0; i < password.length; i++) {
            if (validChars.has(password.charAt(i))) {
                tempPassword += password.charAt(i);
            }
        }
        const $ = cheerio.load(await uFetch(TSINGHUA_HOME_LOGIN_URL));
        await uFetch(
            TSINGHUA_HOME_LOGIN_URL,
            undefined,
            {
                __VIEWSTATE: $("#__VIEWSTATE").attr().value,
                __VIEWSTATEGENERATOR: $("#__VIEWSTATEGENERATOR").attr().value,
                net_Default_LoginCtrl1$txtUserName: userId,
                net_Default_LoginCtrl1$txtUserPwd: tempPassword,
                "net_Default_LoginCtrl1$lbtnLogin.x": 17,
                "net_Default_LoginCtrl1$lbtnLogin.y": 10,
                net_Default_LoginCtrl1$txtSearch1: "",
                Home_Img_NewsCtrl1$hfJsImg: "",
                Home_Img_ActivityCtrl1$hfScript: "",
                Home_Vote_InfoCtrl1$Repeater1$ctl01$hfID: 52,
                Home_Vote_InfoCtrl1$Repeater1$ctl01$rdolstSelect: 221,
            },
        );
    }
};

const verifyAndReLogin = async (helper: InfoHelper): Promise<boolean> => {
    const verification = await uFetch(WEB_VPN_ROOT_URL, WEB_VPN_ROOT_URL);
    if (!verification.includes("个人信息")) {
        const {userId, password, dormPassword} = helper;
        await login(helper, userId, password, dormPassword);
        return true;
    } else {
        return false;
    }
};

export const roamingWrapper = async <R>(
    helper: InfoHelper,
    policy: RoamingPolicy | undefined,
    payload: string,
    operation: () => Promise<R>,
): Promise<R> => {
    try {
        if (policy) {
            try {
                return await operation();
            } catch {
                await roam(helper, policy, payload);
                return await operation();
            }
        } else {
            return await operation();
        }
    } catch (e) {
        if (await verifyAndReLogin(helper)) {
            return await operation();
        } else {
            throw e;
        }
    }
};

export const roamingWrapperWithMocks = async <R>(
    helper: InfoHelper,
    policy: RoamingPolicy | undefined,
    payload: string,
    operation: () => Promise<R>,
    fallback: R,
): Promise<R> =>
    helper.mocked()
        ? Promise.resolve(fallback)
        : roamingWrapper(helper, policy, payload, operation);

const retryWrapper = async <R>(
    helper: InfoHelper,
    target: ValidTickets | undefined,
    operation: () => Promise<R>,
): Promise<R> => {
    try {
        if (target) {
            try {
                return await operation();
            } catch {
                await getTicket(helper, target);
                return await operation();
            }
        } else {
            return await operation();
        }
    } catch (e) {
        if (await verifyAndReLogin(helper)) {
            return await operation();
        } else {
            throw e;
        }
    }
};

export const retryWrapperWithMocks = async <R>(
    helper: InfoHelper,
    target: ValidTickets | undefined,
    operation: () => Promise<R>,
    fallback: R,
): Promise<R> =>
    helper.mocked()
        ? Promise.resolve(fallback)
        : retryWrapper(helper, target, operation);

const batchGetTickets = (helper: InfoHelper, tickets: ValidTickets[], indicator?: () => void) =>
    Promise.all(
        tickets.map((target) =>
            getTicket(helper, target)
                .then(() => console.log(`Ticket ${target} get.`))
                .catch(() => console.warn(`Getting ticket ${target} failed.`))
                .then(indicator),
        ),
    );

const keepAlive = (helper: InfoHelper) => {
    helper.keepAliveTimer && clearInterval(helper.keepAliveTimer);
    helper.keepAliveTimer = setInterval(async () => {
        // TODO: keep alive
    }, 60000);
};
