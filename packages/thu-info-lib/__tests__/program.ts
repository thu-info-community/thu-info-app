import {it} from "@jest/globals";
import {InfoHelper} from "../src";

let userId = "";
let password = "";

try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const secrets = require("../secrets.json");
    userId = secrets.userId;
    password = secrets.password;
} catch (e) {
    userId = process.env.INFO_USER_ID!;
    password = process.env.INFO_PASSWORD!;
}

it("It should get program & course plan", async () => {
    const helper = new InfoHelper();
    await helper.login({userId, password});
    const semester = (await helper.getCrAvailableSemesters())[0].id;
    console.log(await helper.getCrCoursePlan(semester));
}, 60000);
