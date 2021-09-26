import {InfoHelper} from "../src";
import {cookies} from "../src/utils/network";
import fetch from "cross-fetch";
import * as fs from "fs";
import * as readline from "readline";

global.console = {
    ...global.console,
    log: jest.fn,
};

let userId = "";
let password = "";
let dormPassword = "";
let emailName = "";

try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const secrets = require("../secrets.json");
    userId = secrets.userId;
    password = secrets.password;
    dormPassword = secrets.dormPassword;
    emailName = secrets.emailName;
} catch (e) {
    userId = process.env.INFO_USER_ID!;
    password = process.env.INFO_PASSWORD!;
    dormPassword = process.env.INFO_DORM_PASSWORD!;
    emailName = process.env.INFO_EMAIL_NAME!;
}

it("should enter mocked account", async()=> {
    const helper = new InfoHelper();
    await helper.login({userId:"8888", password:"8888"}, ()=>{});
    await helper.logout();
    expect(helper.mocked()).toEqual(true);
}, 60000);

it("should login successfully.", async () => {
    const helper = new InfoHelper();
    const counter = jest.fn();
    await helper.login({userId, password, dormPassword}, counter);
    await fetch(await helper.getCrCaptchaUrl(), {headers: {Cookie: Object.keys(cookies).map((key) => `${key}=${cookies[key]}`).join(";")}})
        .then((r) => r.arrayBuffer())
        .then((r) => fs.createWriteStream("captcha.jpg").write(Buffer.from(r)));
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    console.error("Please enter");
    await new Promise((resolve, reject) => {
        rl.on("line", async (str) => {
            try {
                await helper.loginCr(str);
                console.error(await helper.searchCrRemaining({
                    semester: "2021-2022-1",
                    name: "网络原理",
                    id: "40240513",
                }));
                await helper.logout();
                expect(helper.mocked()).toEqual(false);
                expect(helper.emailName).toEqual(emailName);
                expect(counter).toBeCalledTimes(InfoHelper.TOTAL_PHASES);
                resolve(true);
                rl.close();
            } catch (e) {
                console.error(e);
                reject(false);
                rl.close();
            }
        });
    });
}, 60000);
