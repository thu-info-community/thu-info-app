import {InfoHelper} from "../src";

jest.mock("../src/utils/network");

const userId = process.env.INFO_USER_ID!;
const password = process.env.INFO_PASSWORD!;
const emailName = process.env.INFO_EMAIL_NAME!;

it("Login test", async () => {
    jest.setTimeout(20000);
    const helper = new InfoHelper("", "", "", "");
    await helper.login(userId, password, () => {}, false);
    expect(helper.emailName).toEqual(emailName);
});
