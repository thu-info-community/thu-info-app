import {expect, it} from "@jest/globals";
import {InfoHelper} from "../src";
import dayjs from "dayjs";

const liveTest = process.env.THU_INFO_RUN_LIVE_TESTS === "1" ? it : it.skip;

it("should enter mocked account", async () => {
    const helper = new InfoHelper();
    await helper.login({userId: "8888", password: "8888"});
    expect(helper.mocked()).toEqual(true);
    await helper.logout();
}, 60000);

liveTest("should login successfully with campus credentials", async () => {
    let userId = process.env.INFO_USER_ID;
    let password = process.env.INFO_PASSWORD;

    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const secrets = require("../secrets.json");
        userId = secrets.userId ?? userId;
        password = secrets.password ?? password;
    } catch {
        // The environment can supply credentials when there is no local file.
    }

    if (!userId || !password) {
        throw new Error("Set INFO_USER_ID and INFO_PASSWORD or provide secrets.json to run the live login test.");
    }

    const helper = new InfoHelper();
    await helper.login({userId, password});
    const {firstDay, weekCount} = await helper.getCalendar();
    expect(weekCount % 3).toEqual(0);
    expect(dayjs(firstDay).day()).toEqual(1);
    expect((await helper.getCrTimetable()).length).toBeGreaterThan(0);
    expect((await helper.getCampusCardInfo()).balance).toBeGreaterThanOrEqual(0);
    await helper.logout();
    expect(helper.mocked()).toEqual(false);
}, 60000);
