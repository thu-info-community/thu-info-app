import {InfoHelper} from "../src";

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

it("It should get program", async () => {
    const helper = new InfoHelper();
    await helper.login({userId, password, dormPassword});
    await helper.getDegreeProgram();
}, 60000);