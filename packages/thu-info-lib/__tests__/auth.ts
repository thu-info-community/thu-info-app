import {InfoHelper} from "../src";

jest.mock("../src/utils/network");

const userId = process.env.INFO_USER_ID!;
const password = process.env.INFO_PASSWORD!;
const dormPassword = process.env.INFO_DORM_PASSWORD!;
const emailName = process.env.INFO_EMAIL_NAME!;

it("Login test", async () => {
    jest.setTimeout(20000);
    const helper = new InfoHelper();
    await helper.login({userId, password, dormPassword}, () => {}, false);
    expect(helper.emailName).toEqual(emailName);
});
