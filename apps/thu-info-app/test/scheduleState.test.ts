import {describe, expect, jest, test} from "@jest/globals";
import dayjs from "dayjs";
import {ScheduleType} from "@thu-info/lib/src/models/schedule/schedule";
import {
	Choice,
	restoreScheduleState,
	serializeScheduleState,
	decodeScheduleState,
	schedulesInSemester,
	sourceScheduleId,
} from "../src/redux/scheduleData";
import {
	scheduleReducer as reduce,
	scheduleAddCustom,
	scheduleDelOrHide,
	scheduleEditCustom,
	scheduleFetch,
	scheduleUploadStarted,
	scheduleEditDetails,
	scheduleRemoveHiddenRule,
	scheduleSync,
} from "../src/redux/slices/schedule";
import {autumn, summer, plan, time} from "./fixtures/schedules";
let mockId = 0;
jest.mock("uuid", () => ({v4: () => String(++mockId)}));

const official = () =>
	plan([time("2025-09-17")], {type: ScheduleType.PRIMARY, category: "课程"});
const fetch = (schedule = [official()], semesterId = autumn.semesterId) =>
	scheduleFetch({schedule, semesterId});

test("separate additions remain independent even with the same name, location and time", () => {
	let state = reduce(undefined, scheduleAddCustom(plan()));
	state = reduce(state, scheduleAddCustom(plan()));
	const [a, b] = state.baseSchedule;
	expect(a.localId).not.toBe(b.localId);
	state = reduce(
		state,
		scheduleDelOrHide([a.localId, a.activeTime.base[0], Choice.ONCE, autumn]),
	);
	expect(state.baseSchedule).toEqual([b]);
});

test("summer Sunday never leaks into autumn and dates survive semester switches", () => {
	let state = reduce(undefined, scheduleAddCustom(plan([time("2025-09-14")])));
	const before = state.baseSchedule[0];
	state = reduce(state, fetch([], autumn.semesterId));
	expect(schedulesInSemester(state.baseSchedule, autumn)).toEqual([]);
	expect(schedulesInSemester(state.baseSchedule, summer)).toEqual([before]);
	state = reduce(state, fetch([], summer.semesterId));
	expect(state.baseSchedule[0]).toEqual(before);
});

describe("editing a subset", () => {
	const create = () =>
		reduce(
			undefined,
			scheduleAddCustom(
				plan([
					time("2025-09-14"),
					time("2025-09-17"),
					time("2025-09-24"),
					time("2025-09-25", "16:00", "17:00"),
					time("2026-07-01"),
				]),
			),
		);
	test("once changes title, location and time only on the clicked occurrence", () => {
		const before = create();
		const original = before.baseSchedule[0];
		const edited = time("2025-09-17", "15:00", "16:00");
		const after = reduce(
			before,
			scheduleEditCustom({
				localId: original.localId,
				time: original.activeTime.base[1],
				choice: Choice.ONCE,
				range: autumn,
				name: "讨论会",
				location: "B",
				slices: [edited],
			}),
		);
		expect(after.baseSchedule[0]).toEqual({
			...original,
			activeTime: {base: original.activeTime.base.filter((_, i) => i !== 1)},
		});
		expect(after.baseSchedule[1]).toMatchObject({
			name: "讨论会",
			location: "B",
			activeTime: {base: [edited]},
		});
		expect(after.baseSchedule[1].localId).not.toBe(original.localId);
		expect(before.baseSchedule[0].activeTime.base).toHaveLength(5);
	});
	test("all repeating preserves other patterns and semesters", () => {
		const before = create(),
			original = before.baseSchedule[0];
		const edited = [
			time("2025-09-17", "15:00", "16:00"),
			time("2025-09-24", "15:00", "16:00"),
		];
		const after = reduce(
			before,
			scheduleEditCustom({
				localId: original.localId,
				time: original.activeTime.base[1],
				choice: Choice.REPEAT,
				range: autumn,
				name: "讨论会",
				location: "B",
				slices: edited,
			}),
		);
		expect(
			after.baseSchedule[0].activeTime.base.map((s) =>
				s.beginTime.format("YYYY-MM-DD"),
			),
		).toEqual(["2025-09-14", "2025-09-25", "2026-07-01"]);
		expect(after.baseSchedule[1].activeTime.base).toEqual(edited);
	});
	test("delete all is restricted to the selected semester", () => {
		const before = create(),
			original = before.baseSchedule[0];
		const after = reduce(
			before,
			scheduleDelOrHide([
				original.localId,
				original.activeTime.base[1],
				Choice.ALL,
				autumn,
			]),
		);
		expect(
			after.baseSchedule[0].activeTime.base.map((s) =>
				s.beginTime.format("YYYY-MM-DD"),
			),
		).toEqual(["2025-09-14", "2026-07-01"]);
	});
});

test("aliases, locations and hidden occurrences survive repeated fetches, another term, and restart", () => {
	let state = reduce(undefined, fetch());
	const id = state.baseSchedule[0].localId,
		slice = state.baseSchedule[0].activeTime.base[0];
	state = reduce(
		state,
		scheduleEditDetails({localId: id, alias: "简称", location: "B"}),
	);
	state = reduce(state, scheduleDelOrHide([id, slice, Choice.ONCE, autumn]));
	state = reduce(state, fetch());
	state = reduce(state, fetch());
	state = reduce(state, fetch([], summer.semesterId));
	state = restoreScheduleState(
		JSON.parse(JSON.stringify(serializeScheduleState(state))),
		autumn.firstDay,
	);
	state = reduce(state, fetch());
	expect(state.baseSchedule[0]).toMatchObject({
		location: "B",
		activeTime: {base: []},
		delOrHideTime: {base: [slice]},
	});
	expect(state.shortenMap[id]).toBe("简称");
	state = reduce(state, scheduleRemoveHiddenRule([id, slice]));
	state = reduce(state, fetch());
	expect(state.baseSchedule[0].activeTime.base).toHaveLength(1);
	expect(state.baseSchedule[0].delOrHideTime.base).toHaveLength(0);
});

test("fetch cannot mutate its input and equal hashes from different categories remain independent", () => {
	const a = official(),
		b = {...official(), category: "个人日历"};
	let state = reduce(undefined, fetch([a, b]));
	const id = state.baseSchedule[0].localId;
	state = reduce(
		state,
		scheduleDelOrHide([id, a.activeTime.base[0], Choice.ONCE, autumn]),
	);
	Object.freeze(a.activeTime.base);
	state = reduce(state, fetch([a, b]));
	expect(a.activeTime.base).toHaveLength(1);
	expect(state.baseSchedule[0].activeTime.base).toHaveLength(0);
	expect(state.baseSchedule[1].activeTime.base).toHaveLength(1);
});

test("only confirmed personal calendar uploads replace local occurrences; official courses do not", () => {
	let state = reduce(undefined, scheduleAddCustom(plan()));
	const id = state.baseSchedule[0].localId;
	state = reduce(
		state,
		scheduleEditDetails({localId: id, alias: "简称", location: "A"}),
	);
	state = reduce(state, fetch());
	expect(
		state.baseSchedule.filter((s) => s.type === ScheduleType.CUSTOM),
	).toHaveLength(1);
	const uploaded = {
		...official(),
		category: "个人日历",
		activeTime: {base: [time("2025-09-17", "14:00", "15:00", 42)]},
	};
	state = reduce(
		state,
		scheduleUploadStarted(
			state.baseSchedule.filter((s) => s.type === ScheduleType.CUSTOM),
		),
	);
	state = reduce(state, fetch([uploaded]));
	expect(state.baseSchedule).toHaveLength(1);
	expect(state.shortenMap[sourceScheduleId(uploaded, autumn.semesterId)]).toBe(
		"简称",
	);
});

test.each(["persistence", "legacy device sync"])(
	"%s preserves IDs and restores Dayjs",
	(format) => {
		let state = reduce(
			undefined,
			fetch([
				plan([time("2025-09-17", "14:00", "15:00", 42)], {
					type: ScheduleType.PRIMARY,
					category: "个人日历",
				}),
			]),
		);
		const wire = JSON.parse(
			JSON.stringify(
				format === "persistence" ? serializeScheduleState(state) : state,
			),
		);
		state = reduce(
			state,
			scheduleSync(wire, autumn.firstDay, autumn.semesterId),
		);
		const restored = state.baseSchedule[0].activeTime.base[0];
		expect(restored.id).toBe(42);
		expect(dayjs.isDayjs(restored.beginTime)).toBe(true);
		expect(restored.beginTime.format("YYYY-MM-DD HH:mm")).toBe(
			"2025-09-17 14:00",
		);
	},
);

test("mixed legacy and hidden-only caches migrate per slice without losing names or metadata", () => {
	const raw = {
		semesterId: autumn.semesterId,
		shortenMap: {组会: "旧简称"},
		baseSchedule: [
			plan([], {
				type: ScheduleType.PRIMARY,
				delOrHideTime: {base: [time("2025-09-17", "14:00", "15:00", 42)]},
			}),
			plan([], {
				name: "123456旧计划",
				activeTime: {
					base: [{dayOfWeek: 7, begin: 1, end: 2, activeWeeks: [1]} as any],
				},
			}),
			plan([time("2025-09-17")], {name: "123456真实名称"}),
		],
	};
	const decoded = decodeScheduleState(JSON.parse(JSON.stringify(raw)));
	const restored = restoreScheduleState(
		decoded,
		autumn.firstDay,
		autumn.semesterId,
	);
	expect(restored.baseSchedule[0].delOrHideTime.base[0].id).toBe(42);
	expect(restored.shortenMap[restored.baseSchedule[0].localId]).toBe("旧简称");
	expect(restored.baseSchedule[1].name).toBe("旧计划");
	expect(
		restored.baseSchedule[1].activeTime.base[0].beginTime.format(
			"YYYY-MM-DD HH:mm",
		),
	).toBe("2025-09-21 08:00");
	expect(restored.baseSchedule[2].name).toBe("123456真实名称");
	expect(
		restoreScheduleState(serializeScheduleState(restored), autumn.firstDay),
	).toEqual(restored);
});

test("invalid sync data is rejected before replacing the current schedule", () => {
	const state = reduce(undefined, scheduleAddCustom(plan()));
	for (const raw of [null, [], {}, {baseSchedule: [plan([{...time("2025-09-17"), endTime: undefined} as any])]}]) {
		expect(() => scheduleSync(raw, autumn.firstDay, autumn.semesterId)).toThrow();
	}
	expect(state.baseSchedule).toHaveLength(1);
});
