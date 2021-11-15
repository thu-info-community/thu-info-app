import {
    ACADEMIC_HOME_URL,
    ACADEMIC_LOGIN_URL,
    ACADEMIC_URL,
    CONFIRM_LOGIN_URL,
    DO_LOGIN_URL,
    DORM_LOGIN_URL_PREFIX,
    DORM_SCORE_REFERER,
    DORM_SCORE_URL,
    ID_LOGIN_CHECK_URL,
    INFO_LOGIN_URL,
    INFO_ROOT_URL,
    INFO_URL,
    LIBRARY_ROOM_BOOKING_LOGIN_REFERER,
    LIBRARY_ROOM_BOOKING_LOGIN_URL,
    LIBRARY_LOGIN_URL,
    LOGIN_URL,
    LOGOUT_URL,
    META_DATA_URL,
    PRE_LOGIN_URL,
    PRE_ROAM_URL_PREFIX,
    TSINGHUA_HOME_LOGIN_URL,
    WEB_VPN_ROOT_URL,
} from "../constants/strings";
import md5 from "md5";
import cheerio from "cheerio";
import {InfoHelper} from "../index";
import {clearCookies, ValidTickets} from "../utils/network";
import {uFetch} from "../utils/network";

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

const loginAcademic = async (
    helper: InfoHelper,
    userId: string,
    password: string,
    indicator?: () => void,
) => {
    const responseA = await uFetch(
        ACADEMIC_LOGIN_URL,
        ACADEMIC_URL,
        {
            userName: userId,
            password,
        },
    );
    if (!responseA.includes("清华大学信息门户")) {
        throw new Error("Failed to login to Academic (step 1).");
    }
    indicator && indicator();

    const MAX_ATTEMPT = 3;
    for (let i = 0; i < MAX_ATTEMPT; ++i) {
        const iFrameUrl = cheerio(
            helper.graduate() ? "#23-2604_iframe" : "#25-2649_iframe",
            await uFetch(ACADEMIC_HOME_URL, ACADEMIC_URL),
        ).attr().src;
        const responseB = await uFetch(iFrameUrl, ACADEMIC_HOME_URL);
        if (responseB.includes("清华大学教学门户")) {
            indicator && indicator();
            return;
        }
    }
    throw new Error(
        `Failed to login to Academic after ${MAX_ATTEMPT} attempts. (step 2).`,
    );
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
            loginAcademic(helper, userId, password, statusIndicator),
        ]);
        await batchGetTickets(
            helper,
            [792, 824, 2005, 5000, 5001, -1, -2, 424] as ValidTickets[],
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

export const getTicket = async (helper: InfoHelper, target: ValidTickets): Promise<void> => {
    if (target === 792 || target === 824) {
        const response = await uFetch(
            INFO_ROOT_URL,
            PRE_LOGIN_URL,
            undefined,
            3000,
        );
        await uFetch(
            cheerio(`#9-${target}_iframe`, response).attr().src,
            INFO_ROOT_URL,
            undefined,
            6000,
        );
    } else if (target === -1) {
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
        await uFetch(
            TSINGHUA_HOME_LOGIN_URL,
            undefined,
            {
                __VIEWSTATE: "",
                __VIEWSTATEGENERATOR: "CA0B0334",
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
    } else if (target === 5000) {
        await uFetch(LIBRARY_LOGIN_URL, undefined);
        const redirect = cheerio(
            "div.wrapper>a",
            await uFetch(ID_LOGIN_CHECK_URL, LIBRARY_LOGIN_URL, {
                i_user: helper.userId,
                i_pass: helper.password,
                i_captcha: "",
            }),
        ).attr().href;
        await uFetch(redirect);
    } else if (target === 5001) {
        await uFetch(LIBRARY_ROOM_BOOKING_LOGIN_URL, LIBRARY_ROOM_BOOKING_LOGIN_REFERER, {
            id: helper.userId,
            pwd: helper.password,
            act: "login",
        });
    } else {
        await uFetch(`${PRE_ROAM_URL_PREFIX}${target}`, PRE_LOGIN_URL);
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
        await batchGetTickets(helper, [792, 824, 2005, 5000, 5001, 424] as ValidTickets[]);
    }, 60000);
};
