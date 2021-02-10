import {InfoHelper} from "../src";

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
    await helper.login({userId:"8888", password:"8888"}, ()=>{}, false);
    await helper.logout();
    expect(helper.mocked()).toEqual(true);
}, 20000);

it("should login successfully.", async () => {
    const helper = new InfoHelper();
    const counter = jest.fn();
    await helper.login({userId, password, dormPassword}, counter, false);
    await helper.logout();
    expect(helper.mocked()).toEqual(false);
    expect(helper.emailName).toEqual(emailName);
    expect(counter).toBeCalledTimes(helper.TOTAL_PHASES);
}, 20000);
