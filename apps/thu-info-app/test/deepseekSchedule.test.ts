import {expect, test} from "@jest/globals";
import dayjs from "dayjs";
import {createScheduleFromToolArgs} from "../src/ui/home/deepseek";
import {ScheduleType} from "@thu-info/lib/src/models/schedule/schedule";

const firstDay = "2025-09-15";
const weekCount = 18;

test("creates a single-day schedule from a date", () => {
	const schedule = createScheduleFromToolArgs(
		{
			title: "组会",
			location: "工物馆",
			date: "2025-09-20",
			beginTime: "14:00",
			endTime: "16:00",
		},
		firstDay,
		weekCount,
	);
	expect(schedule).toBeDefined();
	expect(schedule!.type).toBe(ScheduleType.CUSTOM);
	expect(schedule!.name).toBe("组会");
	expect(schedule!.location).toBe("工物馆");
	expect(schedule!.activeTime.base).toHaveLength(1);
	const slice = schedule!.activeTime.base[0];
	expect(slice.beginTime.format("YYYY-MM-DD")).toBe("2025-09-20");
	expect(slice.beginTime.format("HH:mm")).toBe("14:00");
	expect(slice.endTime.format("HH:mm")).toBe("16:00");
});

test("creates a weekly schedule for given weeks", () => {
	const schedule = createScheduleFromToolArgs(
		{
			title: "组会",
			dayOfWeek: 5,
			beginTime: "14:00",
			endTime: "16:00",
			weeks: [1, 3],
		},
		firstDay,
		weekCount,
	);
	expect(schedule).toBeDefined();
	expect(schedule!.activeTime.base).toHaveLength(2);
	expect(schedule!.activeTime.base[0].dayOfWeek).toBe(5);
	expect(schedule!.activeTime.base[0].beginTime.format("YYYY-MM-DD")).toBe(
		dayjs(firstDay).add(4, "day").format("YYYY-MM-DD"),
	);
	expect(schedule!.activeTime.base[1].beginTime.format("YYYY-MM-DD")).toBe(
		dayjs(firstDay).add(18, "day").format("YYYY-MM-DD"),
	);
});

test("defaults weekly schedule to every week", () => {
	const schedule = createScheduleFromToolArgs(
		{title: "组会", dayOfWeek: 1, beginTime: "08:00", endTime: "09:35"},
		firstDay,
		weekCount,
	);
	expect(schedule).toBeDefined();
	expect(schedule!.activeTime.base).toHaveLength(weekCount);
});

test("returns undefined for invalid args", () => {
	expect(
		createScheduleFromToolArgs({title: "组会"}, firstDay, weekCount),
	).toBeUndefined();
	expect(
		createScheduleFromToolArgs(
			{title: "组会", date: "2025-09-20"},
			firstDay,
			weekCount,
		),
	).toBeUndefined();
	expect(
		createScheduleFromToolArgs(
			{title: "组会", dayOfWeek: 9, beginTime: "14:00", endTime: "16:00"},
			firstDay,
			weekCount,
		),
	).toBeUndefined();
	expect(
		createScheduleFromToolArgs(
			{title: "组会", date: "2025/09/20", beginTime: "14:00", endTime: "16:00"},
			firstDay,
			weekCount,
		),
	).toBeUndefined();
});
