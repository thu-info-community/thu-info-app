import {beforeEach, expect, jest, test} from "@jest/globals";
import {sm2} from "sm-crypto";
import {InfoHelper} from "../index";
import {__idCredentialFormForTest, login, passwordlessEntry, roam, roamingWrapper} from "./core";
import {authenticatePasskey} from "./passkey";
import {PasskeyError} from "../utils/error";
import {clearCookies, getRedirectUrl, uFetch} from "../utils/network";
import {
    GET_COOKIE_URL,
    ID_BASE_URL,
    ID_HOST_URL,
    ID_LOGIN_URL,
    ID_WEBSITE_BASE_URL,
    ID_WEBSITE_LOGIN_URL,
    ROAMING_URL,
    WEB_VPN_OAUTH_LOGIN_URL,
} from "../constants/strings";
import {LoginError} from "../utils/error";

jest.mock("../utils/network", () => ({
    clearCookies: jest.fn(),
    getRedirectUrl: jest.fn(),
    uFetch: jest.fn(),
}));
jest.mock("./passkey", () => ({authenticatePasskey: jest.fn()}));

const PUBLIC_KEY = sm2.generateKeyPairHex().publicKey;

const LOGIN_SUCCESS_HTML =
    "<html><body>登录成功。正在重定向到 <b><i>WEBVPN </i></b> ...<br/>" +
    "<a href=\"https://oauth.tsinghua.edu.cn/thu-oauth/callback?sig=deadbeef\">跳转</a></body></html>";

// The page the ID platform serves instead of the credential form when the
// login entry was reached with a `singleLogin` session. Note the absence of
// `#sm2publicKey`: there is nothing to encrypt a password with. The form is
// posted to the root-relative action on the ID host, so that is what the
// library must call.
const TRUSTED_ENTRY_HTML = [
    "<html><head><title>Title</title></head><body>",
    "<form action=\"/do/off/ui/auth/login/checkSingle\" method=\"POST\" id=\"logined\">",
    "<input type=\"hidden\" name=\"i_rememberme\" value=\"on\">",
    "<input type=\"hidden\" name=\"fingerPrint\" id=\"fingerPrint\">",
    "<input type=\"hidden\" name=\"fingerGenPrint\" id=\"fingerGenPrint\">",
    "</form></body></html>",
].join("");
const TRUSTED_ENTRY_POST_URL = `${ID_HOST_URL}/do/off/ui/auth/login/checkSingle`;

// Same idea for the `/f/` entry behind `id_website`, except that it posts to
// `/security_check` with no `i_rememberme` field — the target differs per entry,
// which is why it is read off the page.
const TRUSTED_WEBSITE_ENTRY_HTML = [
    "<html><head><title>Title</title></head><body>",
    "<form action=\"/security_check\" method=\"POST\" id=\"logined\">",
    "<input type=\"hidden\" name=\"fingerPrint\" id=\"fingerPrint\">",
    "<input type=\"hidden\" name=\"fingerGenPrint\" id=\"fingerGenPrint\">",
    "</form></body></html>",
].join("");

const CREDENTIAL_ENTRY_HTML = `<div style="display:none" id="sm2publicKey">${PUBLIC_KEY}</div>`;

const mockLogin = () => new InfoHelper();

const mockFetch = (opts: {entry?: string; passwordless?: string; roamingUrl?: string} = {}) => {
    const entry = opts.entry ?? CREDENTIAL_ENTRY_HTML;
    jest.mocked(uFetch).mockImplementation(async (url: string) => {
        if (url === WEB_VPN_OAUTH_LOGIN_URL || url.startsWith(ID_BASE_URL) || url === ID_WEBSITE_BASE_URL) {
            return entry;
        }
        if (url === TRUSTED_ENTRY_POST_URL) {
            return opts.passwordless ?? LOGIN_SUCCESS_HTML;
        }
        if (url === ID_WEBSITE_LOGIN_URL) {
            // `/security_check` signals success with the settings page it lands
            // on rather than the redirect notice.
            return "<html><body>账号设置</body></html>";
        }
        if (url === ID_LOGIN_URL) {
            return LOGIN_SUCCESS_HTML;
        }
        if (url === GET_COOKIE_URL) {
            return "XSRF-TOKEN=csrf-token;";
        }
        if (url.startsWith(ROAMING_URL)) {
            return JSON.stringify({result: "success", object: {roamingurl: opts.roamingUrl ?? "https://zhjw.cic.tsinghua.edu.cn/index"}});
        }
        return "<html></html>";
    });
    jest.mocked(getRedirectUrl).mockImplementation(async () => "https://webvpn.tsinghua.edu.cn/redirected");
};

// The `POST` body of the first request to `url`, as a plain object.
const postedTo = (url: string) => {
    const call = jest.mocked(uFetch).mock.calls.find(([u]) => u === url);
    return call?.[1] as {[key: string]: string} | undefined;
};

beforeEach(() => {
    jest.clearAllMocks();
    InfoHelper.prototype.trustFingerprintNameHook = async () => "THU Info Lib";
});

test("credential form carries the upstream trusted-browser fields", async () => {
    const helper = mockLogin();
    helper.userId = "2026000000";
    helper.password = "secret";
    helper.fingerprint = "00000000000000000000000000000000";

    const form = await __idCredentialFormForTest(helper, PUBLIC_KEY, helper.password, "i_user");
    expect(form.i_user).toEqual("2026000000");
    expect(form.i_pass?.startsWith("04")).toEqual(true);
    expect(form.fingerPrint).toEqual(helper.fingerprint);
    expect(form.singleLogin).toEqual("on");
    expect(form.deviceName).toEqual("THU Info Lib");
});

test("credential form omits singleLogin when the browser is not trusted", async () => {
    const helper = mockLogin();
    helper.userId = "2026000000";
    helper.trustBrowser = false;

    const form = await __idCredentialFormForTest(helper, PUBLIC_KEY, "secret", "i_user");
    // Absent, not `undefined`: `stringify` would serialize the latter literally.
    expect("singleLogin" in form).toEqual(false);
    expect("deviceName" in form).toEqual(false);
});

test("credential form uses the /security_check field names for id_website", async () => {
    const helper = mockLogin();
    helper.userId = "2026000000";

    const form = await __idCredentialFormForTest(helper, PUBLIC_KEY, "secret", "username");
    expect(form.username).toEqual("2026000000");
    expect(form.password?.startsWith("04")).toEqual(true);
    expect("i_user" in form).toEqual(false);
    expect(form.singleLogin).toEqual("on");
});

test("login submits the trusted-browser fields", async () => {
    mockFetch();
    const helper = mockLogin();
    helper.userId = "2026000000";
    helper.password = "secret";
    helper.fingerprint = "00000000000000000000000000000000";

    await login(helper, helper.userId, helper.password);

    const form = postedTo(ID_LOGIN_URL);
    expect(form?.singleLogin).toEqual("on");
    expect(form?.fingerPrint).toEqual(helper.fingerprint);
    expect(clearCookies).toHaveBeenCalled();
});

test("roam into a subsystem reuses the trusted session without a password", async () => {
    mockFetch({entry: TRUSTED_ENTRY_HTML});
    const helper = mockLogin();
    helper.userId = "2026000000";
    helper.password = "secret";
    helper.fingerprint = "00000000000000000000000000000000";

    await roam(helper, "id", "10000ea055dd8d81d09d5a1ba55d39ad");

    const form = postedTo(TRUSTED_ENTRY_POST_URL);
    expect(form?.i_rememberme).toEqual("on");
    expect(form?.fingerPrint).toEqual(helper.fingerprint);
    // The password was never submitted: there was no public key to encrypt it
    // with, and the platform had already recognised the device fingerprint.
    expect(postedTo(ID_LOGIN_URL)).toBeUndefined();
});

test("roam with an untrusted browser falls back to the credential form", async () => {
    mockFetch();
    const helper = mockLogin();
    helper.userId = "2026000000";
    helper.password = "secret";

    await roam(helper, "id", "10000ea055dd8d81d09d5a1ba55d39ad");

    expect(postedTo(TRUSTED_ENTRY_POST_URL)).toBeUndefined();
    expect(postedTo(ID_LOGIN_URL)?.i_pass?.startsWith("04")).toEqual(true);
});

test("roam throws the public-key error when neither path is available", async () => {
    // An untrusted fingerprint is answered with the credential form again, and
    // that page still has no public key for us to use.
    mockFetch({entry: TRUSTED_ENTRY_HTML, passwordless: CREDENTIAL_ENTRY_HTML});
    const helper = mockLogin();
    helper.userId = "2026000000";
    helper.password = "secret";

    await expect(roam(helper, "id", "10000ea055dd8d81d09d5a1ba55d39ad")).rejects.toBeInstanceOf(LoginError);
    expect(postedTo(ID_LOGIN_URL)).toBeUndefined();
});

test("roam into id_website reuses the trusted session through its own form", async () => {
    mockFetch({entry: TRUSTED_WEBSITE_ENTRY_HTML});
    const helper = mockLogin();
    helper.userId = "2026000000";
    helper.password = "secret";
    helper.fingerprint = "00000000000000000000000000000000";

    await roam(helper, "id_website", "");

    // `id_website` posts to `/security_check`, which carries no `i_rememberme`
    // and no SM2-encrypted password.
    const form = postedTo(ID_WEBSITE_LOGIN_URL);
    expect(form?.fingerPrint).toEqual(helper.fingerprint);
    expect(form?.password).toBeUndefined();
    expect("i_rememberme" in (form ?? {})).toEqual(false);
});

test("roam into id_website posts the /security_check field names", async () => {
    mockFetch();
    const helper = mockLogin();
    helper.userId = "2026000000";
    helper.password = "secret";

    await roam(helper, "id_website", "");

    const form = postedTo(ID_WEBSITE_LOGIN_URL);
    expect(form?.username).toEqual("2026000000");
    expect(form?.password?.startsWith("04")).toEqual(true);
    expect(form?.singleLogin).toEqual("on");
    expect(postedTo(ID_LOGIN_URL)).toBeUndefined();
});

test("passwordlessEntry declines when the browser is not trusted", async () => {
    mockFetch({entry: TRUSTED_ENTRY_HTML});
    const helper = mockLogin();
    helper.trustBrowser = false;

    expect(await passwordlessEntry(helper, TRUSTED_ENTRY_HTML)).toBeNull();
    expect(jest.mocked(uFetch)).not.toHaveBeenCalled();
});

test("passwordlessEntry needs a trusted-browser form on the entry page", async () => {
    mockFetch();
    const helper = mockLogin();
    helper.fingerprint = "00000000000000000000000000000000";

    expect(await passwordlessEntry(helper, CREDENTIAL_ENTRY_HTML)).toBeNull();
    expect(jest.mocked(uFetch)).not.toHaveBeenCalled();
});

test("the mocked account never touches the network", async () => {
    mockFetch();
    const helper = mockLogin();

    await login(helper, "8888", "8888");

    expect(helper.mocked()).toEqual(true);
    expect(jest.mocked(uFetch)).not.toHaveBeenCalled();
    expect(clearCookies).not.toHaveBeenCalled();
});

test("an already authenticated ID website skips the login form", async () => {
    const settings = "<title>账号设置 - 清华大学用户电子身份服务系统</title><body>账号设置</body>";
    mockFetch({entry: settings});
    expect(await roam(mockLogin(), "id_website", "")).toBe(settings);
    expect(postedTo(ID_WEBSITE_LOGIN_URL)).toBeUndefined();
});

test("parallel passwordless logins share one signature and cookie reset", async () => {
    mockFetch();
    const helper = mockLogin();
    const credential = {keyId: "local", credentialId: "id", userId: "2026000000", userHandle: "handle",
        rpId: "tsinghua.edu.cn", publicKeyX: "x", publicKeyY: "y", protectionLevel: "unknown" as const};
    helper.passkeyCredential = credential;
    jest.mocked(authenticatePasskey).mockResolvedValue(credential.userId);
    await Promise.all(Array.from({length: 5}, () => login(helper, credential.userId, "")));
    expect(clearCookies).toHaveBeenCalledTimes(1);
    // One WebVPN login and one independent portal bootstrap, both use the selected mode.
    expect(authenticatePasskey).toHaveBeenCalledTimes(2);
    expect(helper.password).toBe("");
    expect(helper.hasAuthentication()).toBe(true);
});

test("terminal Passkey errors do not retry roaming or fall back to passwords", async () => {
    mockFetch();
    const helper = mockLogin();
    helper.userId = "2026000000";
    helper.passkeyCredential = {keyId: "local", userId: helper.userId} as NonNullable<InfoHelper["passkeyCredential"]>;
    const operation = jest.fn(async () => { throw new PasskeyError("missing", "请重新设置。"); });
    await expect(roamingWrapper(helper, "id", "", operation)).rejects.toMatchObject({code: "missing"});
    expect(operation).toHaveBeenCalledTimes(1);
    expect(uFetch).not.toHaveBeenCalled();
    expect(clearCookies).not.toHaveBeenCalled();
});
