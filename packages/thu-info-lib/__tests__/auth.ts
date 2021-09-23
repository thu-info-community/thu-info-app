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
    const date = "2021-09-23";
    const gymId = "4836273";
    const itemId = "14567218";
    const resources = await helper.getSportsResources(gymId, itemId, date);
    expect(resources.count).toEqual(1);
    expect(resources.init).toEqual(1);
    await fetch(helper.getSportsCaptchaUrl(), {headers: {Cookie: Object.keys(cookies).map((key) => `${key}=${cookies[key]}`).join(";")}})
        .then((r) => r.arrayBuffer())
        .then((r) => fs.createWriteStream("captcha.jpg").write(Buffer.from(r)));
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    console.error("Please enter");
    rl.on("line", async (str) => {
        const firstResource = resources.data.find((r) => r.locked !== true);
        if (firstResource !== undefined && firstResource.cost !== undefined && resources.phone !== undefined) {
            await helper.makeSportsReservation(
                firstResource.cost,
                resources.phone,
                gymId,
                itemId,
                date,
                str,
                firstResource.resId,
            );
        }
        await helper.logout();
        expect(helper.mocked()).toEqual(false);
        expect(helper.emailName).toEqual(emailName);
        expect(counter).toBeCalledTimes(InfoHelper.TOTAL_PHASES);
    });
}, 60000);
