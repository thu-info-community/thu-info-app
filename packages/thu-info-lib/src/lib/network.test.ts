import {beforeEach, expect, jest, test} from "@jest/globals";
import type {InfoHelper} from "../index";
import {roamingWrapper, roamingWrapperWithMocks} from "./core";
import {uFetch} from "../utils/network";
import {NETWORK_ROAM_ID, getNetworkBalance, getOnlineDevices, loginNetwork, logoutNetwork} from "./network";
import {
    NETWORK_HOME_DELETE_URL,
    NETWORK_HOME_URL,
    NETWORK_IMPORT_DEVICE_URL,
    NETWORK_LOGIN_URL,
} from "../constants/strings";
import {LibError, UseregAuthError} from "../utils/error";

jest.mock("./core", () => ({
    roamingWrapper: jest.fn((_helper: unknown, _policy: unknown, _payload: unknown, operation: (param?: string) => Promise<unknown>) => operation()),
    roamingWrapperWithMocks: jest.fn((_helper: unknown, _policy: unknown, _payload: unknown, operation: (param?: string) => Promise<unknown>) => operation()),
}));
jest.mock("../utils/network", () => ({uFetch: jest.fn()}));

const helper = {mocked: () => false, password: "secret"} as unknown as InfoHelper;

// Serve the usereg login form. Contains no WebVPN title, so it is the
// "WebVPN is fine but usereg is not signed in" case.
const LOGIN_HTML = "<form><div class=\"field-loginform-verifycode\">验证码</div></form>";
const WEB_VPN_HTML = "<html><head><title>清华大学WebVPN</title></head></html>";

const HOME_HTML = [
    "<div id=\"w3-container\"><table><tbody><tr>",
    "<td>学生</td><td>114.5G</td><td>14h19m19s</td><td>8.10</td><td>2025-02-01</td>",
    "</tr></tbody></table></div>",
    "<div id=\"w1-container\"><table><tbody>",
    "<tr data-key=\"32123\"><td>101.5.32.123</td><td>2402:f000::1</td>",
    "<td>2025-01-23 04:42:15</td><td>h3c无线网</td><td>71-FF-FF-C8-02-3A</td></tr>",
    "</tbody></table></div>",
].join("");

const DELETE_HTML = "<div id=\"w5-success-0\"></div>";

const mockFetch = (home = HOME_HTML, login = "<html></html>") => {
    jest.mocked(uFetch).mockImplementation(async (url: string, post?: object) => {
        if (url === NETWORK_LOGIN_URL) {
            return login;
        }
        if (url === NETWORK_HOME_URL) {
            return home;
        }
        if (url === NETWORK_IMPORT_DEVICE_URL) {
            return post === undefined
                ? "<input name=\"_csrf-8800\" value=\"token\" />"
                : "<div id=\"w0-success-0\">\n\n准入成功</div>";
        }
        if (url.startsWith(NETWORK_HOME_DELETE_URL.split("?")[0])) {
            return DELETE_HTML;
        }
        throw new Error(`Unexpected url: ${url}`);
    });
};

beforeEach(() => {
    jest.clearAllMocks();
});

test("usereg is reached by roaming through the information portal, without a captcha", async () => {
    mockFetch();

    expect(await getNetworkBalance(helper)).toEqual({
        productName: "学生",
        usedBytes: "114.5G",
        usedSeconds: "14h19m19s",
        accountBalance: "8.10",
        settlementDate: "2025-02-01",
    });
    expect(roamingWrapperWithMocks).toHaveBeenCalledWith(
        helper,
        "default",
        NETWORK_ROAM_ID,
        expect.any(Function),
        expect.anything(),
    );

    expect(await getOnlineDevices(helper)).toEqual([{
        key: 32123,
        ip4: "101.5.32.123",
        ip6: "2402:f000::1",
        loggedAt: "2025-01-23 04:42:15",
        authPermission: "h3c无线网",
        mac: "71-FF-FF-C8-02-3A",
    }]);
});

test("device mutations share the same usereg roaming entry", async () => {
    mockFetch();

    expect(await loginNetwork(helper, "10.0.0.1", true)).toEqual("准入成功");
    await logoutNetwork(helper, {
        key: 32123,
        ip4: "101.5.32.123",
        ip6: "2402:f000::1",
        loggedAt: "2025-01-23 04:42:15",
        authPermission: "h3c无线网",
        mac: "71-FF-FF-C8-02-3A",
    });

    expect(roamingWrapper).toHaveBeenCalledWith(
        helper,
        "default",
        NETWORK_ROAM_ID,
        expect.any(Function),
    );
});

test("an unauthenticated usereg page is reported as UseregAuthError so the wrapper roams", async () => {
    mockFetch(HOME_HTML, LOGIN_HTML);

    await expect(getNetworkBalance(helper)).rejects.toBeInstanceOf(UseregAuthError);
});

test("a WebVPN login page is a plain LibError, not a usereg auth failure", async () => {
    mockFetch(HOME_HTML, WEB_VPN_HTML);

    const error = await getNetworkBalance(helper).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LibError);
    expect(error).not.toBeInstanceOf(UseregAuthError);
});
