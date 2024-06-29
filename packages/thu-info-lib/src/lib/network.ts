import { InfoHelper } from "../index";
import { roamingWrapperWithMocks } from "./core";
import { uFetch } from "../utils/network";
import cheerio from "cheerio";
import { Detial } from "../models/network/detial";
import { LibError } from "../utils/error";
import {
    NETWORK_DETAIL_URL, NETWORK_IMPORT_CHALLENGE,
    NETWORK_IMPORT_IP, NETWORK_IMPORT_LOGIN,
    NETWORK_IMPORT_USER,
    NETWORK_USER_INFO,
    NETWORK_1X_USER,
} from "../constants/strings";
import { Device } from "../models/network/device";
import { Balance } from "../models/network/balance";
import { xEncode, xBase64Encode } from "../utils/srunCrypto";
import CryptoJS from "crypto-js/core";

export const webVPNTitle = "<title>清华大学WebVPN</title>";

export const getNetworkDetail = async (helper: InfoHelper, year: number, month: number): Promise<Detial> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "66D157166A3E5EEB3C558B66803B2929",
        async () => {
            const resp = await uFetch(NETWORK_DETAIL_URL + `&year=${year}&month=${month}`);
            if (resp === "请登录先" || resp.includes(webVPNTitle))
                throw new LibError();
            const $ = cheerio.load(resp);
            const tr = $(".maintab table:eq(2) tbody tr:eq(1)").children();
            return {
                year: year,
                month: month,
                wiredUsage: {
                    in: tr.eq(1).text(),
                    out: tr.eq(2).text(),
                    total: tr.eq(3).text(),
                    onlineTime: tr.eq(4).text(),
                    loginCount: tr.eq(5).text(),
                    currentCost: tr.eq(6).text()
                },
                wirelessUsage: {
                    in: tr.eq(7).text(),
                    out: tr.eq(8).text(),
                    total: tr.eq(9).text(),
                    onlineTime: tr.eq(10).text(),
                    loginCount: tr.eq(11).text(),
                    currentCost: tr.eq(12).text()
                },
                monthlyCost: tr.eq(13).text()
            };
        },
        {
            month: 4,
            year: 2023,
            wiredUsage: {
                in: "0B",
                out: "0B",
                total: "0B",
                onlineTime: "0秒",
                loginCount: "0",
                currentCost: "0.00"
            },
            wirelessUsage: {
                in: "404.06M",
                out: "5.40G",
                total: "5.80G",
                onlineTime: "14小时6分25秒",
                loginCount: "6",
                currentCost: "0.00"
            },
            monthlyCost: "0"
        }
    );

export const getOnlineDevices = async (helper: InfoHelper): Promise<Device[]> => roamingWrapperWithMocks(
    helper,
    "default",
    "66D157166A3E5EEB3C558B66803B2929",
    async () => {
        const ret: Device[] = [];
        const resp1 = await uFetch(NETWORK_IMPORT_USER);
        if (resp1 === "请登录先" || resp1.includes(webVPNTitle))
            throw new LibError();
        const $1 = cheerio.load(resp1);
        const importDevices = $1(".maintab tr td table:eq(1) tr");
        for (let i = 0; i < importDevices.length; i++) {
            if (i === 0) continue;
            const device = importDevices.eq(i).children();
            ret.push({
                ip4: device.eq(1).text(),
                ip6: device.eq(2).text(),
                loggedAt: device.eq(3).text(),
                in: device.eq(4).text(),
                out: device.eq(5).text(),
                nasIp: device.eq(6).text(),
                mac: device.eq(8).text(),
                authType: "import"
            });
        }
        const resp2 = await uFetch(NETWORK_1X_USER);
        if (resp2 === "请登录先")
            throw new LibError();
        const $2 = cheerio.load(resp2);
        const x1Devices = $2(".maintab tr td table:eq(1) tr");
        for (let i = 0; i < x1Devices.length; i++) {
            if (i === 0) continue;
            const device = x1Devices.eq(i).children();
            if (device.eq(3).text() === "1970-01-01 08:00:00")
                continue;
            ret.push({
                ip4: device.eq(1).text(),
                ip6: device.eq(2).text(),
                loggedAt: device.eq(3).text(),
                in: device.eq(4).text(),
                out: device.eq(5).text(),
                nasIp: device.eq(6).text(),
                mac: device.eq(8).text(),
                authType: "802.1x"
            });
        }
        return ret;
    },
    [
        {
            ip4: "183.123.123.123",
            ip6: "::",
            loggedAt: "2023-04-02 04:42:15",
            in: "203.81M",
            out: "3.18G",
            nasIp: "172.123.123.123",
            mac: "abcd-abcd-abcd",
            authType: "import"
        },
        {
            ip4: "183.123.123.123",
            ip6: "2402:f000:3:7801::0",
            loggedAt: "2023-04-02 09:50:21",
            in: "309.41M",
            out: "26.90M",
            nasIp: "172.123.123.123",
            mac: "AB-CD-EF-GH-IJ-KL",
            authType: "802.1x"
        }
    ]
);

export const getNetworkBalance = async (helper: InfoHelper): Promise<Balance> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "66D157166A3E5EEB3C558B66803B2929",
        async () => {
            const resp = await uFetch(NETWORK_USER_INFO);
            if (resp === "请登录先" || resp.includes(webVPNTitle))
                throw new LibError();
            const $ = cheerio.load(resp);
            const balances = $("table.maintab tr:eq(2) td:eq(1) table tr:eq(9)").children();
            return {
                "accountBalance": balances.eq(1).text().trim(),
                "availableBalance": balances.eq(3).text().trim()
            };
        },
        {
            "accountBalance": "1.14(元)",
            "availableBalance": "5.14元"
        }
    );

export const logoutNetwork = async (device: Device): Promise<void> => {
    await uFetch(device.authType == "import" ? NETWORK_IMPORT_USER : NETWORK_1X_USER, {
        action: "drop",
        user_ip: device.ip4
    });
};

export const loginNetwork = async (helper: InfoHelper, ip: string, internet: boolean): Promise<string> => {
    // Get nas_id. Nas ID identifies the access controller for the device.
    let nas_id = await uFetch(NETWORK_IMPORT_IP, {
        actionType: "searchNasId",
        ip: ip
    });

    // If the device is not found, use the default nas_id. Although it indicates that the login process is to fail.
    if (nas_id === "fail") {
        nas_id = "1";
    }

    let username = (await helper.getUserInfo()).emailName;
    if (!internet) {
        username = username + "@tsinghua";
    }

    // Get challenge
    const challenge_jsonp = await uFetch(NETWORK_IMPORT_CHALLENGE
        .replace("{username}", username)
        .replace("{ip}", ip));

    const challenge_json = JSON.parse(challenge_jsonp.slice(2, -1));

    if (challenge_json.res != "ok") {
        throw new LibError(challenge_json.error_msg);
    }

    const token: string = challenge_json.challenge;
    const password = helper.password;

    // Use srun_bx1 to encrypt the info.
    const info = "{SRBX1}" + xBase64Encode(xEncode(JSON.stringify({
        username: username,
        password: password,
        ip: ip,
        acid: nas_id,
        enc_ver: "srun_bx1"
    }), token));

    // There seems to be a bug in srun protocol by passing `undefined` to password,
    // so it seems that hmd5 is not used to authenticate the user.
    const hmd5 = CryptoJS.HmacMD5(token, password).toString();

    const checksum = CryptoJS.SHA1(token + username + token + hmd5 + token + nas_id + token + ip + token + "200" + token + "1" + token + info).toString();

    const auth = NETWORK_IMPORT_LOGIN
        .replace("{username}", encodeURIComponent(username))
        .replace("{pass_md5}", hmd5)
        .replace("{nas_id}", nas_id)
        .replace("{ip}", encodeURIComponent(ip))
        .replace("{info}", encodeURIComponent(info))
        .replace("{checksum}", checksum);

    const result_jsonp = await uFetch(auth);
    const result_json = JSON.parse(result_jsonp.slice(2, -1));

    if (result_json.res !== "ok") {
        // IP Already Online
        if (result_json.res === "ip_already_online_error") {
            throw new LibError("ip_already_online_error");
        }

        throw new LibError(result_json.error_msg);
    }

    return result_json.suc_msg;
};
