import {expect, jest, test} from "@jest/globals";
import dayjs from "dayjs";
import {ScheduleType} from "@thu-info/lib/src/models/schedule/schedule";
import {buildScheduleSnapshot} from "../src/utils/scheduleWidget";
import {StoredSchedule} from "../src/redux/scheduleData";
import {autumn, plan, time} from "./fixtures/schedules";

// The snapshot builder only reads schedule/config state; a minimal fake keeps
// the test independent of the full redux store.
const stateOf = (schedules: StoredSchedule[], config: Record<string, unknown> = {}) =>
	({
		config: {...autumn, language: "zh", ...config},
		schedule: {
			semesterId: autumn.semesterId,
			baseSchedule: schedules,
			shortenMap: {},
			customCnt: 1,
			overrides: {},
			pendingUploads: [],
		},
	}) as any;

const stored = (schedules: ReturnType<typeof plan>[]): StoredSchedule[] =>
	schedules.map((schedule, index) => ({...schedule, localId: `id-${index}`}));

const withFakeNow = <T>(now: string, run: () => T): T => {
	jest.useFakeTimers().setSystemTime(new Date(now));
	try {
		return run();
	} finally {
		jest.useRealTimers();
	}
};

test("snapshot covers seven consecutive days starting today", () => {
	const snapshot = withFakeNow("2025-09-17T10:00:00", () =>
		buildScheduleSnapshot(
			stateOf(
				stored([
					plan([time("2025-09-17", "08:00", "09:35")]),
					plan([time("2025-09-21", "14:00", "15:40")], {
						name: "周末课",
						hash: "f",
					}),
				]),
			),
		),
	);
	expect(snapshot.v).toBe(1);
	expect(snapshot.week).toBe(1);
	expect(snapshot.nextDays).toHaveLength(7);
	expect(snapshot.nextDays.map((d) => d.date)).toEqual([
		"09-17",
		"09-18",
		"09-19",
		"09-20",
		"09-21",
		"09-22",
		"09-23",
	]);
	// 2025-09-17 is a Wednesday; labels are localized app-side.
	expect(snapshot.nextDays.map((d) => d.label)).toEqual([
		"三",
		"四",
		"五",
		"六",
		"日",
		"一",
		"二",
	]);
	expect(snapshot.today.items).toHaveLength(1);
	expect(snapshot.today.items[0]).toMatchObject({
		name: "组会",
		loc: "A",
		from: "08:00",
		to: "09:35",
		begin: dayjs("2025-09-17 08:00").valueOf(),
		end: dayjs("2025-09-17 09:35").valueOf(),
	});
	// 2025-09-21 is Sunday (dayOfWeek 7) of teaching week 1.
	expect(snapshot.nextDays[4]?.dayOfWeek).toBe(7);
	expect(snapshot.nextDays[4]?.items.map((x) => x.name)).toEqual(["周末课"]);
	expect(snapshot.tomorrow.items).toHaveLength(0);
	expect(snapshot.weekView?.days.map((day) => day.dayOfWeek)).toEqual([
		1, 2, 3, 4, 5, 6, 7,
	]);
	expect(snapshot.weekView?.days[0].date).toBe("09-15");
	expect(snapshot.weekView?.days[6].date).toBe("09-21");
	expect(snapshot.empty).toBe(false);
});

test("weekly view hides an empty weekend and honors the explicit weekend setting", () => {
	const weekdayOnly = withFakeNow("2025-09-17T10:00:00", () =>
		buildScheduleSnapshot(
			stateOf(stored([plan([time("2025-09-17", "08:00", "09:35")])])),
		),
	);
	expect(weekdayOnly.weekView?.showWeekend).toBe(false);
	expect(weekdayOnly.weekView?.days.map((day) => day.dayOfWeek)).toEqual([
		1, 2, 3, 4, 5,
	]);

	const sundayClass = stored([
		plan([time("2025-09-21", "14:00", "15:40")], {
			name: "周末课",
			hash: "weekend",
		}),
	]);
	const visible = withFakeNow("2025-09-17T10:00:00", () =>
		buildScheduleSnapshot(stateOf(sundayClass)),
	);
	expect(visible.weekView?.showWeekend).toBe(true);
	expect(visible.weekView?.blocks.some((block) => block.dayOfWeek === 7)).toBe(true);

	const hidden = withFakeNow("2025-09-17T10:00:00", () =>
		buildScheduleSnapshot(stateOf(sundayClass, {hideWeekend: true})),
	);
	expect(hidden.weekView?.showWeekend).toBe(false);
	expect(hidden.weekView?.days).toHaveLength(5);
	expect(hidden.weekView?.blocks.some((block) => block.dayOfWeek > 5)).toBe(false);
});

test("weekly view follows schedule filters and time mode", () => {
	const schedules = stored([
		plan([time("2025-09-16", "08:00", "09:35")], {
			name: "自定义日程",
			hash: "custom",
		}),
		plan([time("2025-09-17", "13:30", "15:05")], {
			name: "官方课程",
			hash: "official",
			type: ScheduleType.PRIMARY,
		}),
	]);
	const snapshot = withFakeNow("2025-09-17T10:00:00", () =>
		buildScheduleSnapshot(
			stateOf(schedules, {
				showCustomSchedule: false,
				showOfficialSchedule: true,
				scheduleUseClassPeriods: false,
			}),
		),
	);
	expect(snapshot.weekView?.classPeriods).toBe(false);
	expect(snapshot.weekView?.blocks.map((block) => block.name)).toEqual([
		"官方课程",
	]);
	expect(snapshot.weekView?.rows.every((row) => row.kind === "hour")).toBe(true);
});

test("weekly view keeps every occurrence inside normalized card bounds", () => {
	const occurrences = Array.from({length: 14}, (_, index) =>
		time(
			"2025-09-15",
			`${String(8 + index).padStart(2, "0")}:00`,
			`${String(8 + index).padStart(2, "0")}:30`,
		),
	);
	const snapshot = withFakeNow("2025-09-17T10:00:00", () =>
		buildScheduleSnapshot(
			stateOf(stored([plan(occurrences, {name: "全天日程", hash: "all-day"})])),
		),
	);
	const blocks = snapshot.weekView?.blocks ?? [];
	expect(blocks).toHaveLength(14);
	for (const block of blocks) {
		expect(block.name).toBe("全天日程");
		expect(block.top).toBeGreaterThanOrEqual(0);
		expect(block.height).toBeGreaterThan(0);
		expect(block.top + block.height).toBeLessThanOrEqual(1.0000001);
	}
});

test("snapshot crosses into the next teaching week", () => {
	const snapshot = withFakeNow("2025-09-21T10:00:00", () =>
		buildScheduleSnapshot(
			stateOf(
				stored([
					plan([time("2025-09-22", "10:00", "11:35")], {
						name: "第二周课",
						hash: "w2",
					}),
				]),
			),
		),
	);
	// Sunday of week 1: the next day belongs to week 2 and must appear.
	expect(snapshot.week).toBe(1);
	expect(snapshot.nextDays[1]?.items.map((x) => x.name)).toEqual(["第二周课"]);
});

test("flags an empty schedule", () => {
	const snapshot = withFakeNow("2025-09-17T10:00:00", () =>
		buildScheduleSnapshot(stateOf([])),
	);
	expect(snapshot.empty).toBe(true);
	expect(snapshot.nextDays.every((d) => d.items.length === 0)).toBe(true);
});
