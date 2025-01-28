import { InfoHelper } from "../index";
import { roamingWrapperWithMocks } from "./core";
import { stringify, uFetch } from "../utils/network";
import * as cheerio from "cheerio";
import { LibError, UseregAuthError } from "../utils/error";
import {
    NETWORK_VERIFICATION_CODE_URL,
    NETWORK_LOGIN_URL,
    NETWORK_VALIDATE_USER_URL,
    NETWORK_HOME_URL,
    NETWORK_HOME_DELETE_URL,
    NETWORK_IMPORT_DEVICE_URL,
    NETWORK_USER_INFO_URL,
    NETWORK_ALLOWED_DEVICES_URL
} from "../constants/strings";
import { Device } from "../models/network/device";
import { Balance } from "../models/network/balance";
import { JSEncrypt } from "jsencrypt";
import { AccountInfo } from "../models/network/account";

export const webVPNTitle = "<title>清华大学WebVPN</title>";

// Refresh and get verification code
export const getNetworkVerificationImageUrl = async (helper: InfoHelper): Promise<string> => {
    if (helper.mocked()) {
        return "";
    }

    await uFetch(NETWORK_VERIFICATION_CODE_URL + "?refresh=1");
    return NETWORK_VERIFICATION_CODE_URL + "?_=" + new Date().getTime();
};


const ensureNetworkLoggedIn = async (): Promise<void> => {
    const resp = await uFetch(NETWORK_LOGIN_URL);
    if (resp.includes(webVPNTitle)) {
        throw new LibError();
    } else if (resp.includes("loginform-verifycode")) {
        throw new UseregAuthError();
    }
};


export const loginUsereg = async (helper: InfoHelper, code: string): Promise<void> => {
    const $ = cheerio.load(await uFetch(NETWORK_LOGIN_URL));
    const csrfToken = $("meta[name=csrf-token]").attr("content");
    if (!csrfToken) {
        throw new Error("Failed to get csrf token.");
    }
    const rsa_pubkey_str = $("#public").val() as string;
    const rsa_pubkey = new JSEncrypt();
    rsa_pubkey.setPublicKey(rsa_pubkey_str);

    const {emailName} = await helper.getUserInfo();
    const password = rsa_pubkey.encrypt(helper.password);

    const result = await (await fetch(NETWORK_VALIDATE_USER_URL, {
        method: "POST",
        headers: {
            "X-CSRF-Token": csrfToken,
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        body: stringify({
            "LoginForm[username]": emailName,
            "LoginForm[password]": password,
            "LoginForm[verifyCode]": code,
        }),
    })).json();

    if (result.success !== true) {
        throw new LibError(result.message);
    }

    const csrfInput = $("input[name=_csrf-8800]").attr("value");
    if (!csrfInput) {
        throw new Error("Failed to get csrf token.");
    }

    await uFetch(NETWORK_LOGIN_URL, {
        "_csrf-8800": csrfInput,
        "LoginForm[username]": emailName,
        "LoginForm[password]": password,
        "LoginForm[smsCode]": "",
        "LoginForm[verifyCode]": code,
    });
};

export const getOnlineDevices = async (helper: InfoHelper): Promise<Device[]> => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        await ensureNetworkLoggedIn();
        const ret: Device[] = [];
        const resp1 = await uFetch(NETWORK_HOME_URL);
        const $1 = cheerio.load(resp1);
        const importDevices = $1("#w1-container table tbody tr");
        for (let i = 0; i < importDevices.length; i++) {
            const key = parseInt(importDevices.eq(i).attr("data-key") || "");
            const device = importDevices.eq(i).children();
            ret.push({
                key: key,
                ip4: device.eq(0).text(),
                ip6: device.eq(1).text(),
                loggedAt: device.eq(2).text(),
                authPermission: device.eq(3).text(),
                mac: device.eq(4).text(),
            });
        }
        return ret;
    },
    [
        {
            key: 32123,
            ip4: "101.5.32.123",
            ip6: "2402:f000:4:809:73ff:ffff:fec8:023a",
            loggedAt: "2025-01-23 04:42:15",
            mac: "71-FF-FF-C8-02-3A",
            authPermission: "h3c无线网(校内访问@tsinghua)",
        },
        {
            key: 103281,
            ip4: "166.111.231.123",
            ip6: "2402:f000:3:7801::0",
            loggedAt: "2023-04-02 09:50:21",
            mac: "AB-CD-EF-GH-IJ-KL",
            authPermission: "h3c有线网(校外访问策略)",
        }
    ]
);

export const getNetworkBalance = async (helper: InfoHelper): Promise<Balance> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "",
        async () => {
            await ensureNetworkLoggedIn();
            const resp = await uFetch(NETWORK_HOME_URL);
            const $ = cheerio.load(resp);
            const balances = $("#w3-container table tbody tr").children();
            return {
                "productName": balances.eq(0).text().trim(),
                "usedBytes": balances.eq(1).text().trim(),
                "usedSeconds": balances.eq(2).text().trim(),
                "accountBalance": balances.eq(3).text().trim(),
                "settlementDate": balances.eq(4).text().trim(),
            };
        },
        {
            "productName": "学生",
            "usedBytes": "114.5G",
            "usedSeconds": "14h19m19s",
            "accountBalance": "8.10",
            "settlementDate": "2025-02-01",
        }
    );

export const getNetworkAccountInfo = async (helper: InfoHelper): Promise<AccountInfo> =>
    roamingWrapperWithMocks(
        helper, undefined, "", async () => {
            await ensureNetworkLoggedIn();
            const $home = cheerio.load(await uFetch(NETWORK_HOME_URL));
            const status = $home(".glyphicon-info-sign").parent().children("a").text().trim();
            const $users = cheerio.load(await uFetch(NETWORK_USER_INFO_URL))("#w0").find("td");
            const username = $users.eq(0).text().trim();
            const contactEmail = $users.eq(1).text().trim();
            const contactPhone = $users.eq(2).text().trim();
            const contactLandline = $users.eq(5).text().trim();
            const realName = $users.eq(6).text().trim();
            const userGroup = $users.eq(7).text().trim();
            const location = $users.eq(3).text().trim();
            const $devices = cheerio.load(await uFetch(NETWORK_ALLOWED_DEVICES_URL));
            const allowedDevicesText = $devices(".glyphicon-exclamation-sign").parent().text().trim();
            const allowedDevices = parseInt(allowedDevicesText.match(/(\d+)/)?.[0] || "0");
            return {
                "username": username,
                "contactEmail": contactEmail,
                "contactPhone": contactPhone,
                "contactLandline": contactLandline,
                "realName": realName,
                "status": status,
                "userGroup": userGroup,
                "location": location,
                "allowedDevices": allowedDevices,
            };
        },
        {
            "username": "thuinfo",
            "contactEmail": "contact@thuinfo.net",
            "contactPhone": "12345678901",
            "contactLandline": "010-62876543",
            "realName": "THUInfo",
            "status": "正常",
            "userGroup": "学生组",
            "location": "",
            "allowedDevices": 8,
        });

export const logoutNetwork = async (device: Device): Promise<void> => {
    await ensureNetworkLoggedIn();
    const $ = cheerio.load(await uFetch(NETWORK_HOME_URL));
    const csrfToken = $("input[name=_csrf-8800]").attr("value");
    const resp = await uFetch(NETWORK_HOME_DELETE_URL.replace("{id}", device.key.toString()).replace("{mac}", device.mac), {
        "_csrf-8800": csrfToken,
    });

    if (!resp.includes("w5-success-0")) {
        const $2 = cheerio.load(resp);
        throw new LibError($2("#w5-danger-0").text().split("\n\n")[1]);
    }
};

export const loginNetwork = async (helper: InfoHelper, ip: string, internet: boolean): Promise<string> => {
    await ensureNetworkLoggedIn();

    const $ = cheerio.load(await uFetch(NETWORK_IMPORT_DEVICE_URL));
    const csrfToken = $("input[name=_csrf-8800]").attr("value");

    const resp = cheerio.load(await uFetch(NETWORK_IMPORT_DEVICE_URL, {
        "_csrf-8800": csrfToken,
        "CertificationForm[ip]": ip,
        "CertificationForm[password]": helper.password,
        "CertificationForm[type]": internet ? "out" : "in",
    }));

    if (resp("#w0-success-0").length > 0) {
        return resp("#w0-success-0").text().split("\n\n")[1];
    }

    else if (resp("#w0-error-0").length > 0) {
        throw new LibError(resp("#w0-error-0").text().split("\n\n")[1]);
    }

    else {
        throw new LibError("Unknown error.");
    }
};
