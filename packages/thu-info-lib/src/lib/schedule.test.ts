import {beforeEach, expect, jest, test} from "@jest/globals";
import dayjs from "dayjs";
import type {InfoHelper} from "../index";
import {getSchedule, saveCustomSchedule, deleteCustomSchedule} from "./schedule";
import {uFetch} from "../utils/network";
import {getCalendar} from "./basics";
import {Schedule, ScheduleType} from "../models/schedule/schedule";
import {JXMH_URL} from "../constants/strings";

jest.mock("./core", () => ({roamingWrapperWithMocks: (_helper: unknown, _policy: unknown, _payload: unknown, operation: () => Promise<unknown>) => operation()}));
jest.mock("../utils/network", () => ({uFetch: jest.fn()}));
jest.mock("./basics", () => ({getCalendar: jest.fn()}));
jest.mock("./cr", () => ({getCRSchedule: jest.fn()}));
const helper = {graduate: () => true} as InfoHelper;
const form = "<form action=\"jxmh.do\"><input name=\"token\" value=\"synthetic-token\"><input name=\"role\" value=\"student\"></form>";
const schedule = (type = ScheduleType.CUSTOM): Schedule => ({name: "测试日程", location: "A", hash: "x", type, category: "个人日历",
    activeTime: {base: [{dayOfWeek: 7, beginTime: dayjs("2025-09-14 08:00"), endTime: dayjs("2025-09-14 09:35"), id: 42}]}, delOrHideTime: {base: []}});
beforeEach(() => {jest.resetAllMocks();});

test("the final primary request stops at the selected term boundary", async () => {
    jest.mocked(getCalendar).mockResolvedValue({firstDay: "2025-06-30", weekCount: 11, semesterId: "test-1", semesterName: "test", nextSemesterList: []});
    jest.mocked(uFetch).mockResolvedValue("m([])");
    expect((await getSchedule(helper, undefined)).schedule).toEqual([]);
    expect(jest.mocked(uFetch)).toHaveBeenCalledTimes(4);
    const final = jest.mocked(uFetch).mock.calls[3][0];
    expect(final).toContain("20250901");
    expect(final).toContain("20250914");
    expect(final).not.toContain("20250921");
});

test.each(["", "<form action=\"jxmh.do\"></form>"])("missing form/token is a rejected save: %s", async (html) => {
    jest.mocked(uFetch).mockResolvedValue(html);
    await expect(saveCustomSchedule(helper, [schedule()])).rejects.toThrow();
    expect(jest.mocked(uFetch)).toHaveBeenCalledTimes(1);
});

test("save uses the occurrence's absolute date and refreshed form token", async () => {
    jest.mocked(uFetch).mockResolvedValue(form);
    await saveCustomSchedule(helper, [schedule()]);
    expect(jest.mocked(uFetch).mock.calls[1]).toEqual([JXMH_URL, expect.objectContaining({m: "saveGrrl", p_date: "20250914", p_start_time: "08:00", p_end_time: "09:35"}), 60000, "GBK"]);
});

test("delete requires a server ID and passes the exact ID", async () => {
    jest.mocked(uFetch).mockResolvedValue(form);
    const missing = schedule(ScheduleType.PRIMARY);
    delete missing.activeTime.base[0].id;
    await expect(deleteCustomSchedule(helper, [missing])).rejects.toThrow("ID");
    jest.mocked(uFetch).mockClear();
    await deleteCustomSchedule(helper, [schedule(ScheduleType.PRIMARY)]);
    expect(jest.mocked(uFetch).mock.calls[1][1]).toEqual(expect.objectContaining({m: "deleteGrrl", grrlID: 42}));
});

test.each([saveCustomSchedule, deleteCustomSchedule])("invalid mutation response cannot resolve as success", async (operation) => {
    jest.mocked(uFetch).mockResolvedValueOnce(form).mockResolvedValueOnce("<html>Login required</html>");
    await expect(operation(helper, [schedule(operation === saveCustomSchedule ? ScheduleType.CUSTOM : ScheduleType.PRIMARY)])).rejects.toThrow();
});
