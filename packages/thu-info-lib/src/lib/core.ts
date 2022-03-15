import {
    CONFIRM_LOGIN_URL,
    DO_LOGIN_URL,
    LIBRARY_ROOM_BOOKING_LOGIN_URL,
    LOGOUT_URL,
    TSINGHUA_HOME_LOGIN_URL,
    USER_DATA_URL,
    GET_COOKIE_URL,
    ID_LOGIN_URL,
    ID_BASE_URL,
    ROAMING_URL,
    GITLAB_LOGIN_URL,
    GITLAB_AUTH_URL,
    INVOICE_LOGIN_URL,
} from "../constants/strings";
import cheerio from "cheerio";
import {InfoHelper} from "../index";
import {clearCookies} from "../utils/network";
import {uFetch} from "../utils/network";
import {DormAuthError, IdAuthError, LibError, LoginError, UrlError} from "../utils/error";

type RoamingPolicy = "default" | "id" | "cab" | "myhome" | "gitlab";

const HOST_MAP: { [key: string]: string } = {
    "zhjw.cic": "77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290",
    "jxgl.cic": "77726476706e69737468656265737421faef469069336153301c9aa596522b20e33c1eb39606919f",
    "ecard": "77726476706e69737468656265737421f5f4408e237e7c4377068ea48d546d303341e9882a",
    "learn": "77726476706e69737468656265737421fcf2408e297e7c4377068ea48d546d30ca8cc97bcc",
    "mails": "77726476706e69737468656265737421fdf64890347e7c4377068ea48d546d3011ff591d40",
    "50": "77726476706e69737468656265737421a5a70f8834396657761d88e29d51367b6a00",
    "166.111.14.8": "77726476706e69737468656265737421a1a117d27661391e2f5cc7f4",
    "fa-online": "77726476706e69737468656265737421f6f60c93293c615e7b469dbf915b243daf0f96e17deaf447b4",
};

const parseUrl = (urlIn: string) => {
    const rawRes = /http:\/\/(\d+.\d+.\d+.\d+):(\d+)\/(.+)/g.exec(urlIn);
    if (rawRes !== null && rawRes[1] !== undefined && rawRes[2] !== undefined && rawRes[3] !== undefined) {
        return `https://webvpn.tsinghua.edu.cn/http-${rawRes[2]}/${HOST_MAP[rawRes[1]]}/${rawRes[3]}`;
    }
    const protocol = urlIn.substring(0, urlIn.indexOf(":"));
    const regRes = /:\/\/(.+?).tsinghua.edu.cn\/(.+)/.exec(urlIn);
    if (regRes === null || regRes[1] === undefined || regRes[2] === undefined) {
        throw new UrlError();
    }
    const host = regRes[1];
    const path = regRes[2];
    return `https://webvpn.tsinghua.edu.cn/${protocol}/${HOST_MAP[host]}/${path}`;
};

export const getCsrfToken = async () => {
    const cookie = await uFetch(GET_COOKIE_URL);
    const q = /XSRF-TOKEN=(.+?);/.exec(cookie + ";");
    if (q === null || q[1] === undefined) {
        throw new Error("Failed to get csrf token.");
    }
    return q[1];
};

export const login = async (
    helper: InfoHelper,
    userId: string,
    password: string,
    dormPassword: string,
): Promise<void> => {
    helper.userId = userId;
    helper.password = password;
    helper.dormPassword = dormPassword;
    if (!helper.mocked()) {
        clearCookies();
        await helper.clearCookieHandler();
        const loginResponse = await uFetch(DO_LOGIN_URL, {
            auth_type: "local",
            username: userId,
            sms_code: "",
            password: password,
        }).then(JSON.parse);
        if (!loginResponse.success) {
            switch (loginResponse.error) {
            case "NEED_CONFIRM":
                await uFetch(CONFIRM_LOGIN_URL, {});
                break;
            default:
                throw new LoginError(loginResponse.message);
            }
        }
        try {
            await roam(helper, "id", "10000ea055dd8d81d09d5a1ba55d39ad");
        } catch (e: any) {
            throw new LoginError(e?.message);
        }
    }
};

export const logout = async (helper: InfoHelper): Promise<void> => {
    if (!helper.mocked()) {
        await uFetch(LOGOUT_URL);
    }
};

export const roam = async (helper: InfoHelper, policy: RoamingPolicy, payload: string): Promise<string> => {
    switch (policy) {
    case "default": {
        const csrf = await getCsrfToken();
        const {object} = await uFetch(`${ROAMING_URL}?yyfwid=${payload}&_csrf=${csrf}&machine=p`, {}).then(JSON.parse);
        const url = parseUrl(object.roamingurl.replace(/&amp;/g, "&"));
        if (url.includes(HOST_MAP["fa-online"])) {
            const roamHtml = await uFetch(url);
            const username = /\("username"\).value = '(.+?)';/.exec(roamHtml);
            if (username === null || username[1] === undefined) {
                throw new LibError("Failed to get username when roaming to fa-online");
            }
            const password = /\("password"\).value = '(.+?)';/.exec(roamHtml);
            if (password === null || password[1] === undefined) {
                throw new LibError("Failed to get password when roaming to fa-online");
            }
            return await uFetch(INVOICE_LOGIN_URL, {username: username[1], password: password[1]});
        }
        return await uFetch(url);
    }
    case "id": {
        await uFetch(ID_BASE_URL + payload);
        let response = await uFetch(ID_LOGIN_URL, {
            i_user: helper.userId,
            i_pass: helper.password,
            i_captcha: "",
        });
        if (!response.includes("登录成功。正在重定向到")) {
            await uFetch(ID_BASE_URL + payload);
            response = await uFetch(ID_LOGIN_URL, {
                i_user: helper.userId,
                i_pass: helper.password,
                i_captcha: "",
            });
            if (!response.includes("登录成功。正在重定向到")) {
                throw new IdAuthError();
            }
        }
        const redirectUrl = cheerio("a", response).attr().href;
        return await uFetch(redirectUrl);
    }
    case "cab": {
        return await uFetch(LIBRARY_ROOM_BOOKING_LOGIN_URL, {
            id: helper.userId,
            pwd: helper.password,
            act: "login",
        });
    }
    case "myhome": {
        const validChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz =+-/_()<>,.'`~");
        const password = helper.dormPassword || helper.password;
        let tempPassword = "";
        for (let i = 0; i < password.length; i++) {
            if (validChars.has(password.charAt(i))) {
                tempPassword += password.charAt(i);
            }
        }
        const $ = cheerio.load(await uFetch(TSINGHUA_HOME_LOGIN_URL));
        const response = await uFetch(TSINGHUA_HOME_LOGIN_URL, {
            __VIEWSTATE: $("#__VIEWSTATE").attr().value,
            __VIEWSTATEGENERATOR: $("#__VIEWSTATEGENERATOR").attr().value,
            net_Default_LoginCtrl1$txtUserName: helper.userId,
            net_Default_LoginCtrl1$txtUserPwd: tempPassword,
            "net_Default_LoginCtrl1$lbtnLogin.x": 17,
            "net_Default_LoginCtrl1$lbtnLogin.y": 10,
            net_Default_LoginCtrl1$txtSearch1: "",
            Home_Img_NewsCtrl1$hfJsImg: "",
            Home_Img_ActivityCtrl1$hfScript: "",
            Home_Vote_InfoCtrl1$Repeater1$ctl01$hfID: 52,
            Home_Vote_InfoCtrl1$Repeater1$ctl01$rdolstSelect: 221,
        });
        if (response.includes("window.alert('用户名或密码错误!');")) {
            throw new DormAuthError();
        }
        return response;
    }
    case "gitlab": {
        const data = await uFetch(GITLAB_LOGIN_URL);
        if (data.includes("sign_out")) return data;
        const authenticity_token = cheerio.load(data)("[name=authenticity_token]").attr().value;
        await uFetch(GITLAB_AUTH_URL, {authenticity_token});
        const response = await uFetch(ID_LOGIN_URL, {
            i_user: helper.userId,
            i_pass: helper.password,
            i_captcha: "",
        });
        if (!response.includes("登录成功。正在重定向到")) {
            throw new IdAuthError();
        }
        const redirectUrl = cheerio("a", response).attr().href;
        return await uFetch(redirectUrl);
    }
    }
};

const verifyAndReLogin = async (helper: InfoHelper): Promise<boolean> => {
    try {
        const {object} = await uFetch(`${USER_DATA_URL}?_csrf=${await getCsrfToken()}`).then(JSON.parse);
        if (object.ryh === helper.userId) {
            return false;
        }
    } catch {
        //
    }
    const {userId, password, dormPassword} = helper;
    await login(helper, userId, password, dormPassword);
    return true;
};

export const roamingWrapper = async <R>(
    helper: InfoHelper,
    policy: RoamingPolicy | undefined,
    payload: string,
    operation: (param?: string) => Promise<R>,
): Promise<R> => {
    try {
        if (policy) {
            try {
                return await operation();
            } catch {
                const result = await roam(helper, policy, payload);
                return await operation(result);
            }
        } else {
            return await operation();
        }
    } catch (e) {
        if (await verifyAndReLogin(helper)) {
            if (policy) {
                const result = await roam(helper, policy, payload);
                return await operation(result);
            } else {
                return await operation();
            }
        } else {
            throw e;
        }
    }
};

export const roamingWrapperWithMocks = async <R>(
    helper: InfoHelper,
    policy: RoamingPolicy | undefined,
    payload: string,
    operation: (param?: string) => Promise<R>,
    fallback: R,
): Promise<R> =>
    helper.mocked()
        ? Promise.resolve(fallback)
        : roamingWrapper(helper, policy, payload, operation);
