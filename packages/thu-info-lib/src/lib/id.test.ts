import {beforeEach, describe, expect, jest, test} from "@jest/globals";
import {sm2} from "sm-crypto";
import {InfoHelper} from "../index";
import {
    DOUBLE_AUTH_URL,
    GET_COOKIE_URL,
    GET_DEVICE_LIST_URL,
    ID_ACCOUNT_SETTINGS_URL,
    ID_HOST_URL,
    ID_LOGIN_LOG_DATA_URL,
    ID_WEBSITE_BASE_URL,
    ID_WEBSITE_LOGIN_URL,
    SAVE_FINGER_URL,
    USER_DATA_URL,
} from "../constants/strings";
import {LibError, UserInfoError} from "../utils/error";
import {parseIdAccountInfo} from "../utils/id-account";
import {uFetch} from "../utils/network";
import {__parseUserInfoForTest} from "./basics";
import {parseIdAuthDevices, parseIdLoginLogs} from "./id";

jest.mock("../utils/network", () => ({
    clearCookies: jest.fn(),
    getRedirectUrl: jest.fn(),
    uFetch: jest.fn(),
}));

// Synthetic fixtures following the real ID page and JSON response shapes.
const account = {
    userId: "2026000000", username: "demo", realName: "张三",
    deptString: "计算机系", phone: "13800000000", lastUpdate: 1787541134000,
};
const settings = (value: object = account) => `<title>账号设置</title><script>$.extend(uidm, {"ss":{"account":${JSON.stringify(value)}}});</script>`;
const trustedEntry = "<form action=\"/security_check\"><input name=\"fingerPrint\"><input name=\"fingerGenPrint\"></form>";
const devices = {result: "success", object: [{id: "test-device", name: "Demo browser", createtime: "2026-01-01 10:00:00", updatetime: "2026-01-02 10:00:00", devic_fingerprint: null}]};
const log = {logintime: "2026-01-02 10:00:00.0", ipaddr: "192.0.2.1", appid: "WebVPN", appid_next: "信息门户", single_sign_on: "0"};
const logs = {draw: 1, recordsTotal: 26, recordsFiltered: 26, data: [log]};

const helper = () => {
    const value = new InfoHelper();
    value.userId = account.userId;
    value.password = "synthetic-password";
    value.fingerprint = "synthetic-fingerprint";
    return value;
};

const mockSession = (override?: (url: string, post?: object) => string | undefined) => {
    jest.mocked(uFetch).mockImplementation(async (url, post) => {
        const overridden = override?.(url, post);
        if (overridden !== undefined) return overridden;
        if (url === ID_ACCOUNT_SETTINGS_URL || url === ID_WEBSITE_LOGIN_URL) return settings();
        if (url === ID_WEBSITE_BASE_URL) return trustedEntry;
        if (url === GET_DEVICE_LIST_URL) return JSON.stringify(devices);
        if (url.startsWith(ID_LOGIN_LOG_DATA_URL)) return JSON.stringify(logs);
        if (url === GET_COOKIE_URL) return "XSRF-TOKEN=test-csrf;";
        if (url.startsWith(USER_DATA_URL)) return JSON.stringify({object: {ryh: account.userId}});
        throw new Error("Unexpected endpoint in read-only query");
    });
};

beforeEach(() => {
    jest.clearAllMocks();
    mockSession();
});

describe("ID parsing", () => {
    test("shares account parsing while preserving the legacy user info contract", () => {
        expect(parseIdAccountInfo(settings()).lastPasswordChangedAt).toBe(account.lastUpdate);
        expect(__parseUserInfoForTest(settings())).toEqual({
            userId: account.userId, username: "demo", fullName: "张三",
            emailName: "demo", deptString: "计算机系", phone: "13800000000",
        });
    });

    test.each([undefined, null, "unknown"])("handles missing or invalid password time %s", (lastUpdate) => {
        expect(parseIdAccountInfo(settings({...account, phone: null, lastUpdate}))).toMatchObject({phone: "", lastPasswordChangedAt: null});
    });

    test("rejects login HTML and malformed account JSON", () => {
        expect(() => parseIdAccountInfo("<title>登录</title>")).toThrow(UserInfoError);
        expect(() => parseIdAccountInfo("\"account\": {broken}")).toThrow(UserInfoError);
    });

    test("maps devices without exposing fingerprints", () => {
        expect(parseIdAuthDevices(JSON.stringify(devices))).toEqual([{
            id: "test-device", name: "Demo browser", createdAt: "2026-01-01 10:00:00", updatedAt: "2026-01-02 10:00:00",
        }]);
        expect(parseIdAuthDevices(JSON.stringify({result: "success", object: []}))).toEqual([]);
        expect(parseIdAuthDevices(JSON.stringify({result: "success", object: [{id: "device", name: null}]}))).toEqual([{id: "device", name: "", createdAt: "", updatedAt: ""}]);
    });

    test("rejects failed device responses instead of displaying an empty list", () => {
        expect(() => parseIdAuthDevices(JSON.stringify({result: "error", object: []}))).toThrow(LibError);
        expect(() => parseIdAuthDevices(JSON.stringify({result: "success", object: null}))).toThrow(LibError);
        expect(() => parseIdAuthDevices("<title>登录</title>")).toThrow();
    });

    test.each([
        {value: null, expected: false}, {value: undefined, expected: false},
        {value: "", expected: false}, {value: "0", expected: true}, {value: "1", expected: true},
    ])("maps SSO $value according to the website", ({value, expected}) => {
        expect(parseIdLoginLogs(JSON.stringify({...logs, data: [{...log, single_sign_on: value}]}))).toEqual({
            total: 26,
            items: [{loginTime: "2026-01-02 10:00:00", ipAddress: "192.0.2.1", appName: "WebVPN", targetAppName: "信息门户", isSingleSignOn: expected}],
        });
    });

    test("accepts empty logs and missing optional log fields without draw", () => {
        expect(parseIdLoginLogs(JSON.stringify({recordsTotal: 0, data: []}))).toEqual({items: [], total: 0});
        expect(parseIdLoginLogs(JSON.stringify({recordsTotal: 1, data: [{}]})).items[0]).toEqual({
            loginTime: "", ipAddress: "", appName: "", targetAppName: null, isSingleSignOn: false,
        });
    });

    test("rejects log errors, invalid totals, and login HTML", () => {
        expect(() => parseIdLoginLogs(JSON.stringify({...logs, error: "Unavailable"}))).toThrow(LibError);
        expect(() => parseIdLoginLogs(JSON.stringify({...logs, recordsTotal: -1}))).toThrow(LibError);
        expect(() => parseIdLoginLogs("<title>登录</title>")).toThrow();
    });
});

test("public methods use only the account and device queries and the page parameter", async () => {
    const value = helper();
    await value.getIdAccountInfo();
    await value.getIdAuthDevices();
    await value.getIdLoginLogs(2);
    expect(jest.mocked(uFetch).mock.calls).toEqual([
        [ID_ACCOUNT_SETTINGS_URL], [GET_DEVICE_LIST_URL, {}], [`${ID_LOGIN_LOG_DATA_URL}?page=2`],
    ]);
});

test.each(["account", "devices", "logs"])("retries %s through the existing trusted session", async (kind) => {
    let first = true;
    const url = kind === "account" ? ID_ACCOUNT_SETTINGS_URL : kind === "devices" ? GET_DEVICE_LIST_URL : `${ID_LOGIN_LOG_DATA_URL}?page=1`;
    mockSession((requested) => {
        if (requested === url && first) {
            first = false;
            return "<title>登录</title>";
        }
    });
    const value = helper();
    if (kind === "account") await value.getIdAccountInfo();
    else if (kind === "devices") await value.getIdAuthDevices();
    else await value.getIdLoginLogs();
    expect(uFetch).toHaveBeenCalledWith(ID_WEBSITE_LOGIN_URL, {fingerPrint: value.fingerprint, fingerGenPrint: ""});
    if (kind !== "account") expect(jest.mocked(uFetch).mock.calls.filter(([requested]) => requested === url)).toHaveLength(2);
});

test("2FA during a read does not register or delete devices or mutate the original hooks", async () => {
    let first = true;
    const key = sm2.generateKeyPairHex().publicKey;
    mockSession((url, post) => {
        if (url === GET_DEVICE_LIST_URL && first) {
            first = false;
            return "<title>登录</title>";
        }
        if (url === ID_WEBSITE_BASE_URL) return `<div id="sm2publicKey">${key}</div>`;
        if (url === ID_WEBSITE_LOGIN_URL) return "二次认证";
        if (url === DOUBLE_AUTH_URL) {
            const action = (post as {action: string}).action;
            return JSON.stringify({result: "success", object: action === "FIND_APPROACHES"
                ? {hasWeChatBool: false, phone: "13800000000", hasTotp: false}
                : {redirectUrl: "/f/account/settings"}});
        }
    });
    const value = helper();
    value.twoFactorMethodHook = async () => "mobile";
    value.twoFactorAuthHook = async () => "000000";
    const trust = jest.fn(async () => true);
    value.trustFingerprintHook = trust;
    await value.getIdAuthDevices();
    expect(value.trustFingerprintHook).toBe(trust);
    expect(value.trustBrowser).toBe(true);
    expect(trust).not.toHaveBeenCalled();
    expect(jest.mocked(uFetch).mock.calls.some(([url]) => url === SAVE_FINGER_URL || /delete|editDevice|unregister|totp|password\/change/.test(url))).toBe(false);
    expect(uFetch).toHaveBeenCalledWith(ID_HOST_URL + "/f/account/settings");
});

test("logged-out reads reject without making requests", async () => {
    const value = new InfoHelper();
    value.loginErrorHook = jest.fn();
    await expect(value.getIdAccountInfo()).rejects.toThrow("Please login.");
    expect(value.loginErrorHook).toHaveBeenCalled();
    expect(uFetch).not.toHaveBeenCalled();
});

test.each([0, -1, 1.5, NaN, Infinity])("rejects invalid page %s before requesting", async (page) => {
    await expect(helper().getIdLoginLogs(page)).rejects.toThrow(RangeError);
    expect(uFetch).not.toHaveBeenCalled();
});

test("mock account supports all three APIs and stops after its first log page", async () => {
    const value = new InfoHelper();
    await value.login({userId: "8888", password: "8888"});
    expect((await value.getIdAccountInfo()).userId).toBe("8888");
    expect((await value.getIdAuthDevices()).length).toBeGreaterThan(0);
    expect((await value.getIdLoginLogs()).items).toHaveLength(2);
    expect(await value.getIdLoginLogs(2)).toEqual({items: [], total: 2});
    expect(uFetch).not.toHaveBeenCalled();
});
