import {InfoHelper} from "../src";
import {uFetch} from "../src/utils/network";
import fs from "fs";

let userId = "";
let password = "";
let dormPassword = "";

try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const secrets = require("../secrets.json");
    userId = secrets.userId;
    password = secrets.password;
    dormPassword = secrets.dormPassword;
} catch (e) {
    userId = process.env.INFO_USER_ID!;
    password = process.env.INFO_PASSWORD!;
    dormPassword = process.env.INFO_DORM_PASSWORD!;
}

it("It should get program & course plan", async () => {
    const helper = new InfoHelper();
    await helper.login({userId, password, dormPassword});
    await helper.getDegreeProgram();
    
    // Go on with your code here.
    /*
    const captchaUrl = await helper.getCrCaptchaUrl();
    const captchaImg = await uFetch(captchaUrl);
    await fs.promises.writeFile("captcha.jpg", captchaImg, {encoding: "base64"});
    const captcha = await new Promise((resolve) => {
        console.log("Please enter the captcha...");
        process.stdin.on("data", (chunk) => resolve(chunk.toString().trim()));
    });
    await helper.loginCr(captcha as string);

    const semester = (await helper.getCrAvailableSemesters())[0].id;
    console.log(await helper.getCrCoursePlan(semester));
    */
}, 60000);