import {expect, test} from "@jest/globals";
import dayjs from "dayjs";
import {ScheduleType} from "@thu-info/lib/src/models/schedule/schedule";
import {StoredSchedule} from "../src/redux/scheduleData";
import {selectDaySchedule} from "../src/utils/scheduleQuery";
import {autumn, plan, time} from "./fixtures/schedules";

const colorList = ["#000000", "#111111", "#222222", "#333333", "#444444"];

const ctxOf = (shortenMap: Record<string, string | undefined> = {}) => ({
	...autumn,
	shortenMap,
	colorList,
});

const stored = (schedules: ReturnType<typeof plan>[]): StoredSchedule[] =>
	schedules.map((schedule, index) => ({...schedule, localId: `id-${index}`}));

test("selects and sorts the schedules of a day", () => {
	const schedules = stored([
		plan([
			time("2025-09-17", "14:00", "15:40"),
			time("2025-09-17", "08:00", "09:35"),
		]),
		plan([time("2025-09-17", "10:00", "11:35")], {name: "后续课", hash: "x"}),
	]);
	const items = selectDaySchedule(schedules, 3, dayjs("2025-09-17"), ctxOf());
	expect(items.map((x) => x.from)).toEqual(["08:00", "10:00", "14:00"]);
	expect(items[0]).toMatchObject({
		name: "组会",
		location: "A",
		to: "09:35",
		dayOfWeek: 3,
		week: 1,
	});
});

test("applies the alias but colors by the source name", () => {
	const schedules = stored([plan([time("2025-09-17")])]);
	const [item] = selectDaySchedule(schedules, 3, dayjs("2025-09-17"), ctxOf({
		"id-0": "短名",
	}));
	expect(item?.name).toBe("短名");
	expect(item?.alias).toBe("短名");
	expect(item?.sourceName).toBe("组会");
});

test("dayOfWeek 8 denotes Monday of the next week", () => {
	const schedules = stored([
		plan([time("2025-09-16")]),
		plan([time("2025-09-22")], {name: "下周课", hash: "y"}),
	]);
	// 2025-09-17 lies in teaching week 1; dayOfWeek 8 must select week 2 Monday.
	const items = selectDaySchedule(schedules, 8, dayjs("2025-09-17"), ctxOf());
	expect(items.map((x) => x.name)).toEqual(["下周课"]);
	expect(items[0]?.week).toBe(2);
});

test("ignores slices outside the semester weeks", () => {
	const schedules = stored([
		plan([time("2025-12-30")]), // week 16 (inside)
		plan([time("2026-02-10")], {name: "超期课", hash: "z"}), // after week 18
	]);
	const inside = selectDaySchedule(schedules, 2, dayjs("2025-12-30"), ctxOf());
	expect(inside).toHaveLength(1);
	const outside = selectDaySchedule(schedules, 2, dayjs("2026-02-10"), ctxOf());
	expect(outside).toHaveLength(0);
});
