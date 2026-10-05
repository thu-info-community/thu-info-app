import {
    CHECK_CURRENT_DEVICE_URL,
    CR_LOGIN_HOME_URL,
    DELETE_DEVICE_URL,
    DOUBLE_AUTH_URL,
    GET_COOKIE_URL,
    GET_DEVICE_LIST_URL,
    GITLAB_AUTH_URL,
    GITLAB_LOGIN_URL,
    ID_BASE_URL,
    ID_HOST_URL,
    ID_LOGIN_URL,
    ID_WEBSITE_BASE_URL,
    ID_WEBSITE_LOGIN_URL,
    INVOICE_LOGIN_URL,
    LOGIN_URL,
    LOGOUT_URL,
    MADMODEL_AUTH_LOGIN_URL,
    ROAMING_URL,
    SAVE_FINGER_URL,
    USER_DATA_URL,
    WEB_VPN_OAUTH_LOGIN_URL,
} from "../constants/strings";
import * as cheerio from "cheerio";
import {InfoHelper} from "../index";
import {clearCookies, getRedirectUrl, uFetch} from "../utils/network";
import {IdAuthError, LibError, LoginError, PasskeyError, UrlError} from "../utils/error";
import {sm2} from "sm-crypto";
import {authenticatePasskey} from "./passkey";

let getRedirectLocation: ((url: string) => Promise<string | null | undefined>) | undefined = undefined;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const rtn_network_utils = require("rtn-network-utils").RTNNetworkUtils;
    if (rtn_network_utils) {
        getRedirectLocation = rtn_network_utils.getRedirectLocation;
    }
} catch { /* empty */ }

type RoamingPolicy = "default" | "id" | "id_website" | "card" | "cab" | "gitlab" | "cr";

const HOST_MAP: { [key: string]: string } = {
    "zhjw.cic": "77726476706e69737468656265737421eaff4b8b69336153301c9aa596522b20bc86e6e559a9b290",
    "jxgl.cic": "77726476706e69737468656265737421faef469069336153301c9aa596522b20e33c1eb39606919f",
    "zhjwxk.cic": "77726476706e69737468656265737421faef469069336153301c9aa596522b20e33c1eb39606919f",
    "ecard": "77726476706e69737468656265737421f5f4408e237e7c4377068ea48d546d303341e9882a",
    "learn": "77726476706e69737468656265737421fcf2408e297e7c4377068ea48d546d30ca8cc97bcc",
    "mails": "77726476706e69737468656265737421fdf64890347e7c4377068ea48d546d3011ff591d40",
    "50": "77726476706e69737468656265737421a5a70f8834396657761d88e29d51367b6a00",
    "166.111.14.8": "77726476706e69737468656265737421a1a117d27661391e2f5cc7f4",
    "fa-online": "77726476706e69737468656265737421f6f60c93293c615e7b469dbf915b243daf0f96e17deaf447b4",
    "dzpj": "77726476706e69737468656265737421f4ed519669247b59700f81b9991b2631aee63c51",
    "jjhyhdf": "77726476706e69737468656265737421fafd49852f346e1e6a1b80a29f5d36342bb9c40cf69277",
    "yhdf": "77726476706e69737468656265737421e9ff459a69247b59700f81b9991b26317dbd36ae",
    "usereg": "77726476706e69737468656265737421e5e4448e223726446d0187ab9040227b54b6c80fcd73",
    "thos": "77726476706e69737468656265737421e4ff4e8f69247b59700f81b9991b2631ca359dd4",
    "zzjl.graduate": "77726476706e69737468656265737421eaed4b9069377a517a1d88b89d1b37269c624d2b1c6925f37faea82b8d",
    "madmodel.cs": "77726476706e69737468656265737421fdf6459128346d5c300b9ae28c462a3b27469fc32211fa26a3e464",
};

const SM2_MAGIC_NUMBER = "04";

const parseUrl = (urlIn: string) => {
    const rawRes = /http:\/\/(\d+.\d+.\d+.\d+):(\d+)\/(.+)/g.exec(urlIn);
    if (rawRes !== null && rawRes[1] !== undefined && rawRes[2] !== undefined && rawRes[3] !== undefined) {
        return `https://webvpn.tsinghua.edu.cn/http-${rawRes[2]}/${HOST_MAP[rawRes[1]]}/${rawRes[3]}`;
    }
    const protocol = urlIn.substring(0, urlIn.indexOf(":"));
    const regRes = /:\/\/(.+?).tsinghua.edu.cn(:(\d+))?\/(.+)/.exec(urlIn);
    if (regRes === null || regRes[1] === undefined || regRes[4] === undefined) {
        throw new UrlError();
    }
    const host = regRes[1];
    const protocolFull = regRes[3] === undefined ? protocol : `${protocol}-${regRes[3]}`;
    const path = regRes[4];
    return `https://webvpn.tsinghua.edu.cn/${protocolFull}/${HOST_MAP[host]}/${path}`;
};

const getWebVPNUrl = (urlIn: string): string => {
    if (urlIn.search("oauth.tsinghua.edu.cn") !== -1) {
        return urlIn;
    }

    const url = new URL(urlIn);
    const scheme = url.protocol.replace(":", "");
    const host = url.hostname;
    const port = url.port || (scheme == "https" ? "443" : "80");
    const uri = url.pathname + (url.search ? url.search : "") + (url.hash ? url.hash : "");
    return `https://oauth.tsinghua.edu.cn/lb-auth/lbredirect?scheme=${scheme}&host=${host}&port=${port}&uri=${uri}`;
};

export const getCsrfToken = async () => {
    const cookie = await uFetch(GET_COOKIE_URL);
    const q = /XSRF-TOKEN=(.+?);/.exec(cookie + ";");
    if (q === null || q[1] === undefined) {
        throw new Error("Failed to get csrf token.");
    }
    return q[1];
};

let outstandingLoginPromise: Promise<void> | undefined = undefined;
let loginOwner = "";
let sessionGeneration = 0;
let authQueue: Promise<unknown> = Promise.resolve();
const pendingRoams = new Map<string, Promise<string>>();
const authScope = (helper: InfoHelper) => `${helper.userId}:${helper.fingerprint}:${helper.passkeyCredential?.keyId ?? "password"}`;
export const withAuthTransaction = <T>(operation: () => Promise<T>): Promise<T> => {
    const promise = authQueue.then(operation, operation);
    authQueue = promise.then(() => undefined, () => undefined);
    return promise;
};
const hasAuthentication = (helper: InfoHelper) => helper.userId !== "" && (helper.password !== "" || helper.passkeyCredential?.userId === helper.userId);

/**
 * Builds the credential `POST` body for the unified ID system.
 *
 * `scheme` selects the field names: `/do/off/ui/auth/login/check` expects
 * `i_user` / `i_pass`, while `/security_check` (the `id_website` policy) expects
 * `username` / `password`. Mixing them up silently breaks the target system, so
 * the mapping lives here rather than at every call site.
 *
 * The upstream login form also carries the "trusted browser" checkbox
 * `singleLogin` — checked by default, labelled "本次登录使用信任浏览器访问校内其他系统时
 * 不必再输入账号密码（统一登录）" — which makes the resulting ID session reusable by
 * other campus systems without a password (see {@link passwordlessEntry}).
 * `fingerGenPrint` is deliberately left empty: the field is a browser-only
 * device token that the ID platform does not require for the trusted flow, and
 * this library has no browser to generate a stable one from.
 */
export const __idCredentialFormForTest = async (
    helper: InfoHelper,
    publicKey: string,
    password: string,
    scheme: "i_user" | "username",
): Promise<{ [key: string]: string }> => {
    const form: { [key: string]: string } = {
        [scheme === "i_user" ? "i_user" : "username"]: helper.userId,
        [scheme === "i_user" ? "i_pass" : "password"]: SM2_MAGIC_NUMBER + sm2.doEncrypt(password, publicKey),
        fingerPrint: helper.fingerprint,
        fingerGenPrint: "",
        i_captcha: "",
    };
    if (helper.trustBrowser) {
        // A checked checkbox submits "on". Both fields must be absent rather
        // than `undefined`: `stringify` iterates over the keys and would
        // otherwise serialize the literal string "undefined".
        form.singleLogin = "on";
        form.deviceName = await helper.trustFingerprintNameHook();
    }
    return form;
};

/**
 * Logs in without a password, reusing the trusted-browser state of a live ID
 * session.
 *
 * When the session was created with `singleLogin`, the ID platform answers the
 * login entry page with a small auto-submitting form instead of the credential
 * form: the OAuth entry targets `/do/off/ui/auth/login/checkSingle`, the `/f/`
 * entry (`id_website`) targets `/security_check`. Neither accepts a password —
 * the fingerprint registered as a trusted device is enough — so the submission
 * is built from the page itself rather than from a hard-coded URL, which also
 * keeps the two entries working without knowing which one we were served. This
 * is what keeps `roam()` from re-sending the password for every campus system it
 * enters.
 *
 * The response has the same shape as the one from `ID_LOGIN_URL`, so callers can
 * follow their usual redirect/`<a href>` handling. Returns `null` when the
 * platform did not grant the passwordless path — no trusted-browser form on the
 * page, or the fingerprint was not accepted — in which case the caller keeps its
 * previous behaviour (throwing, as there is no public key to encrypt with).
 */
export const passwordlessEntry = async (helper: InfoHelper, entryHtml: string): Promise<string | null> => {
    if (!helper.trustBrowser) {
        return null;
    }
    const $ = cheerio.load(entryHtml);
    const form = $("form")
        .filter((_i, f) => $(f).find("input[name='fingerPrint']").length > 0)
        .first();
    const action = form.attr("action");
    if (action === undefined) {
        return null;
    }
    // The form submits itself with a script that fills in the fingerprint, so
    // take the field list from the markup: `checkSingle` carries `i_rememberme=on`
    // on top of the fingerprint, `/security_check` carries nothing else.
    const body: { [key: string]: string } = {};
    form.find("input[name]").each((_i, input) => {
        const name = $(input).attr("name")!;
        body[name] = name === "fingerPrint" ? helper.fingerprint : $(input).attr("value") ?? "";
    });
    let response: string;
    try {
        // Resolved against the ID platform rather than the entry page: the action
        // is root-relative, and this is where the ID session cookie lives (the
        // `cr` entry is served through WebVPN, so the two differ).
        response = await uFetch(action.startsWith("/") ? ID_HOST_URL + action : action, body);
    } catch {
        return null;
    }
    // A fingerprint the platform does not trust is answered with the credential
    // form again, i.e. nothing was granted.
    return response.includes("sm2publicKey") ? null : response;
};

/**
 * Obtains the login response for the unified ID system, preferring the
 * passwordless path when the live session is trusted.
 *
 * `entryHtml` is the login entry page the caller has already fetched: an empty
 * public key means the platform served the trusted-browser form instead of the
 * credential form, so there is nothing to encrypt a password with.
 */
const idLoginResponse = async (
    helper: InfoHelper,
    entryHtml: string,
    idLoginUrl: string,
    scheme: "i_user" | "username",
): Promise<string> => {
    const sm2PublicKey = cheerio.load(entryHtml)("#sm2publicKey").text();
    if (sm2PublicKey === "") {
        const passwordless = await passwordlessEntry(helper, entryHtml);
        if (passwordless === null) {
            throw new LoginError("Failed to get public key.");
        }
        return passwordless;
    }
    const secret = helper.passkeyCredential ? await authenticatePasskey(helper) : helper.password;
    return await uFetch(idLoginUrl, await __idCredentialFormForTest(helper, sm2PublicKey, secret, scheme));
};

const twoFactorAuth = async (helper: InfoHelper): Promise<string> => {
    const { result: r1, msg: m1, object: o1 } = JSON.parse(await uFetch(DOUBLE_AUTH_URL, {
        action: "FIND_APPROACHES",
    }));
    if (r1 != "success") {
        throw new LoginError(m1);
    }
    if (!helper.twoFactorMethodHook) {
        throw new LoginError("Required to select 2FA method");
    }
    const method = await helper.twoFactorMethodHook(o1.hasWeChatBool, o1.phone, o1.hasTotp);
    if (method === undefined) {
        throw new LoginError("2FA required");
    }
    const { result: r2, msg: m2 } = JSON.parse(await uFetch(DOUBLE_AUTH_URL, {
        action: "SEND_CODE",
        type: method,
    }));
    if (r2 != "success") {
        throw new LoginError(m2);
    }
    if (!helper.twoFactorAuthHook) {
        throw new LoginError("2FA required");
    }
    const code = await helper.twoFactorAuthHook();
    if (code === undefined) {
        throw new LoginError("2FA required");
    }
    const { result: r3, msg: m3, object: o3 } = JSON.parse(await uFetch(DOUBLE_AUTH_URL, {
        action: method === "totp" ? "VERITY_TOTP_CODE" : "VERITY_CODE",
        vericode: code,
    }));
    if (r3 != "success") {
        throw new LoginError(m3);
    }
    if (helper.trustFingerprintHook) {
        const trustFingerprint = await helper.trustFingerprintHook();
        if (trustFingerprint) {
            const { result: r4, msg: m4 } = JSON.parse(await uFetch(SAVE_FINGER_URL, {
                fingerprint: helper.fingerprint,
                deviceName: await helper.trustFingerprintNameHook(),
                radioVal: "是",
            }));
            if (r4 != "success") {
                if (m4.includes("上限") || m4.includes("limit")) {
                    helper.twoFactorAuthLimitHook && await helper.twoFactorAuthLimitHook();
                }
                else {
                    throw new LoginError(m4);
                }
            }
        }
    }
    return await uFetch(ID_HOST_URL + o3.redirectUrl);
};

export const login = async (
    helper: InfoHelper,
    userId: string,
    password: string,
): Promise<void> => {
    const owner = `${userId}:${helper.fingerprint}:${helper.passkeyCredential?.keyId ?? "password"}`;
    if (outstandingLoginPromise) {
        if (loginOwner === owner) return outstandingLoginPromise;
        await outstandingLoginPromise.catch(() => undefined);
    }
    helper.userId = userId;
    helper.password = helper.passkeyCredential ? "" : password;
    if (!hasAuthentication(helper) || !/^\d+$/.test(userId)) {
        const error = new LoginError(hasAuthentication(helper) ? "请输入学号。" : "请先登录。");
        helper.loginErrorHook?.(error);
        throw error;
    }
    if (helper.mocked()) return;
    loginOwner = owner;
    const promise = withAuthTransaction(async () => {
        // Cookie clearing belongs inside the shared authentication transaction.
        clearCookies();
        await helper.clearCookieHandler();
        await uFetch(WEB_VPN_OAUTH_LOGIN_URL);
        let entryHtml: string;
        if (getRedirectLocation) {
            const oauthUrl = await getRedirectLocation(WEB_VPN_OAUTH_LOGIN_URL);
            if (!oauthUrl) throw new LoginError("Failed to get oauth url.");
            await uFetch(oauthUrl);
            const idUrl = await getRedirectLocation(oauthUrl);
            if (!idUrl) throw new LoginError("Failed to get id url.");
            entryHtml = await uFetch(idUrl);
        } else {
            entryHtml = await uFetch(WEB_VPN_OAUTH_LOGIN_URL);
        }
        let response = await idLoginResponse(helper, entryHtml, ID_LOGIN_URL, "i_user");
        if (response.includes("二次认证")) response = await twoFactorAuth(helper);
        if (!response.includes("登录成功。正在重定向到")) {
            throw new LoginError(cheerio.load(response)("#msg_note").text().trim() || "登录失败，请稍后重试。");
        }
        const callbackUrl = cheerio.load(response)("a").attr("href");
        if (!callbackUrl) throw new LoginError("登录失败，请稍后重试。");
        const redirectUrl = await (getRedirectLocation ?? getRedirectUrl)(callbackUrl);
        if (redirectUrl === LOGIN_URL || !redirectUrl) throw new LoginError("登录失败，请稍后重试。");
        if (getRedirectLocation) await uFetch(redirectUrl);
        // This is a sub-step of the existing transaction, not a second queued login.
        await roamUnlocked(helper, "id", "10000ea055dd8d81d09d5a1ba55d39ad");
        sessionGeneration++;
    });
    outstandingLoginPromise = promise;
    try {
        await promise;
    } catch (error) {
        helper.loginErrorHook?.(error as LoginError);
        throw error;
    } finally {
        if (outstandingLoginPromise === promise) outstandingLoginPromise = undefined;
    }
};

export const logout = async (helper: InfoHelper): Promise<void> => {
    if (!helper.mocked()) {
        helper.userId = "";
        helper.password = "";
        helper.passkeyCredential = undefined;
        await uFetch(LOGOUT_URL);
    } else {
        helper.userId = "";
        helper.password = "";
    }
};

export const roam = async (helper: InfoHelper, policy: RoamingPolicy, payload: string): Promise<string> => {
    if (outstandingLoginPromise) await outstandingLoginPromise;
    const key = `${authScope(helper)}:${sessionGeneration}:${policy}:${payload}`;
    const existing = pendingRoams.get(key);
    if (existing) return existing;
    const promise = withAuthTransaction(() => roamUnlocked(helper, policy, payload));
    pendingRoams.set(key, promise);
    try { return await promise; }
    finally { if (pendingRoams.get(key) === promise) pendingRoams.delete(key); }
};

const roamUnlocked = async (helper: InfoHelper, policy: RoamingPolicy, payload: string): Promise<string> => {
    switch (policy) {
    case "default": {
        const csrf = await getCsrfToken();
        const {object} = await uFetch(`${ROAMING_URL}?yyfwid=${payload}&_csrf=${csrf}&machine=p`).then(JSON.parse);
        const url = parseUrl(object.roamingurl.replace(/&amp;/g, "&"));
        if (url.includes(HOST_MAP["dzpj"])) {
            const roamHtml = await uFetch(url);
            const ticket = /\("ticket"\).value = '(.+?)';/.exec(roamHtml);
            if (ticket === null || ticket[1] === undefined) {
                throw new LibError("Failed to get ticket when roaming to fa-online");
            }
            return await uFetch(INVOICE_LOGIN_URL, {ticket: ticket[1]});
        }
        if (url.includes(HOST_MAP["madmodel.cs"])) {
            const ticket = /ticket=(.+)/.exec(url);
            if (ticket === null || ticket[1] === undefined) {
                throw new LibError("Failed to get ticket of madmodel.cs");
            }
            await uFetch(url);
            return await uFetch(`${MADMODEL_AUTH_LOGIN_URL}/check?ticket=${ticket[1]}`);
        }
        return await uFetch(url);
    }
    case "card":
    case "cab":
    case "cr":
    case "id_website":
    case "id": {
        const idBaseUrl = policy === "card" ? ID_BASE_URL : policy === "id_website" ? ID_WEBSITE_BASE_URL : ID_BASE_URL;
        const idLoginUrl = policy === "card" ? ID_LOGIN_URL : policy === "id_website" ? ID_WEBSITE_LOGIN_URL : ID_LOGIN_URL;
        let response = "";
        const target = policy === "id_website" ? "账号设置" : "登录成功。正在重定向到";
        for (let i = 0; i < 2; i++) {
            const entryHtml = await uFetch(policy === "cr" ? CR_LOGIN_HOME_URL : (idBaseUrl + payload));
            // /f/login redirects an already authenticated session straight to account settings.
            response = policy === "id_website" && !entryHtml.includes("sm2publicKey") &&
                cheerio.load(entryHtml)("title").text().includes("账号设置") ? entryHtml :
                await idLoginResponse(helper, entryHtml, idLoginUrl, policy === "id_website" ? "username" : "i_user");
            if (response.includes("二次认证")) {
                response = await twoFactorAuth(helper);
            }
            if (response.includes(target)) {
                break;
            }
        }
        if (!response.includes(target)) {
            throw new IdAuthError();
        }
        if (policy === "id_website") {
            return response;
        }
        let redirectUrl = cheerio.load(response)("a").attr()!.href;
        if (policy !== "card") {
            redirectUrl = getWebVPNUrl(redirectUrl);
            if (getRedirectLocation) {
                // Patch for OpenHarmony
                const idUrl = await getRedirectLocation(redirectUrl);
                if (!idUrl) {
                    throw new LoginError("Failed to get id url.");
                }
                redirectUrl = idUrl;
            }
        }
        return await uFetch(redirectUrl);
    }
    case "gitlab": {
        const data = await uFetch(GITLAB_LOGIN_URL);
        if (data.includes("sign_out")) return data;
        const authenticity_token = cheerio.load(data)("[name=authenticity_token]").attr()!.value;
        const entryHtml = await uFetch(GITLAB_AUTH_URL, {authenticity_token});
        let response = await idLoginResponse(helper, entryHtml, ID_LOGIN_URL, "i_user");
        if (response.includes("二次认证")) {
            response = await twoFactorAuth(helper);
        }
        if (!response.includes("登录成功。正在重定向到")) {
            throw new IdAuthError();
        }
        const redirectUrl = cheerio.load(response)("a").attr()!.href;
        return await uFetch(redirectUrl);
    }
    }
};

export const verifyAndReLogin = async (helper: InfoHelper): Promise<boolean> => {
    if (outstandingLoginPromise) {
        await outstandingLoginPromise;
        return true;
    }
    try {
        const {object} = await uFetch(`${USER_DATA_URL}?_csrf=${await getCsrfToken()}`).then(JSON.parse);
        if (object.ryh === helper.userId) {
            return false;
        }
    } catch {
        //
    }
    const {userId, password} = helper;
    await login(helper, userId, password);
    return true;
};

export const roamingWrapper = async <R>(
    helper: InfoHelper,
    policy: RoamingPolicy | undefined,
    payload: string,
    operation: (param?: string) => Promise<R>,
): Promise<R> => {
    if (!hasAuthentication(helper)) {
        const e = new LoginError("Please login.");
        helper.loginErrorHook && helper.loginErrorHook(e);
        throw e;
    }
    if (outstandingLoginPromise) await outstandingLoginPromise;
    const generation = sessionGeneration;
    try {
        if (policy) {
            try {
                return await operation();
            } catch (error) {
                if (error instanceof PasskeyError) throw error;
                let result: string;
                try {
                    result = await roam(helper, policy, payload);
                } catch (roamError) {
                    if (roamError instanceof PasskeyError) throw roamError;
                    result = await roam(helper, policy, payload);
                }
                return await operation(result);
            }
        } else {
            return await operation();
        }
    } catch (e) {
        if (e instanceof PasskeyError) throw e;
        if (generation !== sessionGeneration || await verifyAndReLogin(helper)) {
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

export const forgetDevice = async (helper: InfoHelper): Promise<void> => {
    await roam(helper, "id_website", "");
    for (let i = 0; i < 10; i++) {
        const {result: r1, msg: m1, object: o1} = JSON.parse(await uFetch(CHECK_CURRENT_DEVICE_URL.replace("{fingerprint}", helper.fingerprint), {}));
        if (r1 != "success") {
            throw new LibError(m1);
        }
        if (o1 === false) {
            break;
        }
        const {result: r2, msg: m2, object: o2} = JSON.parse(await uFetch(GET_DEVICE_LIST_URL, {}));
        if (r2 != "success") {
            throw new LibError(m2);
        }
        const ourDeviceList = o2.filter(({name}: any) => name.startsWith("THU Info APP"));
        if (ourDeviceList.length > 0) {
            const {result: r3, msg: m3} = JSON.parse(await uFetch(DELETE_DEVICE_URL, {uuid: ourDeviceList[ourDeviceList.length - 1].id}));
            if (r3 != "success") {
                throw new LibError(m3);
            }
        } else {
            throw new LibError("No matching device.");
        }
    }
};
