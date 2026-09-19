import {expect, jest, test} from "@jest/globals";
import dayjs from "dayjs";
import {buildScheduleSnapshot} from "../src/utils/scheduleWidget";
import {StoredSchedule} from "../src/redux/scheduleData";
import {autumn, plan, time} from "./fixtures/schedules";

// The snapshot builder only reads schedule/config state; a minimal fake keeps
// the test independent of the full redux store.
const stateOf = (schedules: StoredSchedule[]) =>
	({
		config: {...autumn, language: "zh"},
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
	expect(snapshot.empty).toBe(false);
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
