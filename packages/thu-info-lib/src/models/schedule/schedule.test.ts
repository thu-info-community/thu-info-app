import {expect, test} from "@jest/globals";
import dayjs from "dayjs";
import {getWeekFromTime, isInSemester, parseJSON, mergeSchedules, ScheduleType} from "./schedule";

test.each(["00:00", "00:01", "08:00", "14:00", "23:59"])("summer week 11 Sunday at %s is before autumn", (hour) => {
    const date = dayjs(`2025-09-14 ${hour}`);
    expect(getWeekFromTime(date, "2025-06-30")).toBe(11);
    expect(getWeekFromTime(date, "2025-09-15")).toBe(0);
    expect(isInSemester(date, "2025-09-15", 18)).toBe(false);
});
test.each([
    ["2025-09-15 00:00", 1], ["2025-09-21 23:59", 1], ["2025-09-22 00:00", 2],
    ["2025-09-07 23:59", -1], ["2025-09-08 00:00", 0],
])("week boundary %s has week %s", (date, week) => {
    expect(getWeekFromTime(dayjs(date), "2025-09-15")).toBe(week);
});
test("personal calendar occurrences keep their server identifiers and absolute dates", () => {
    const rows = [14, 21].map((day, i) => ({nq: `2025-09-${day}`, nr: "测试", dd: "A", fl: "个人日历", grrlID: i + 1, kssj: "08：00", jssj: "09：35"}));
    const [schedule] = parseJSON(rows);
    expect(schedule.activeTime.base.map((s) => s.id)).toEqual([1, 2]);
    expect(schedule.activeTime.base.map((s) => s.beginTime.format("YYYY-MM-DD"))).toEqual(["2025-09-14", "2025-09-21"]);
});

test("same-name schedules from distinct sources are not merged", () => {
    const schedule = {name: "课程", location: "A", hash: "x", category: "课程", activeTime: {base: []}, delOrHideTime: {base: []}};
    expect(mergeSchedules([{...schedule, type: ScheduleType.PRIMARY}, {...schedule, type: ScheduleType.SECONDARY}])).toHaveLength(2);
});
