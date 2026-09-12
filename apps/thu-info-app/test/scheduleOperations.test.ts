import {expect, jest, test} from "@jest/globals";
import {configureStore} from "@reduxjs/toolkit";
import {
	Schedule,
	ScheduleType,
} from "@thu-info/lib/src/models/schedule/schedule";
import {
	scheduleReducer,
	scheduleFetch,
	scheduleAddCustom,
	scheduleSync,
} from "../src/redux/slices/schedule";
import {Choice} from "../src/redux/scheduleData";
import {
	deleteScheduleOccurrences,
	uploadCustomSchedules,
} from "../src/redux/scheduleOperations";
import {autumn, plan, time} from "./fixtures/schedules";

let mockId = 0;
jest.mock("uuid", () => ({v4: () => String(++mockId)}));
const server = (slices = [time("2025-09-17", "14:00", "15:00", 42)]) =>
	plan(slices, {type: ScheduleType.PRIMARY, category: "个人日历"});
const setup = (remote: Schedule[] = []) => {
	const store = configureStore({
		reducer: {schedule: scheduleReducer, config: () => autumn},
		middleware: (m) => m({serializableCheck: false}),
	});
	store.dispatch(
		scheduleFetch({schedule: remote, semesterId: autumn.semesterId}),
	);
	const helper = {
		getSchedule: jest.fn(async () => ({
			schedule: remote,
			calendar: {...autumn, semesterName: "秋季", nextSemesterList: []},
		})),
		deleteCustomSchedule: jest.fn(async (schedules: Schedule[]) => {
			const ids = schedules.flatMap((s) =>
				s.activeTime.base.map((slice) => slice.id),
			);
			remote = remote.map((s) => ({
				...s,
				activeTime: {
					base: s.activeTime.base.filter((slice) => !ids.includes(slice.id)),
				},
			}));
		}),
		saveCustomSchedule: jest.fn(async (_schedules: Schedule[]) => {}),
	};
	return {store, helper};
};

test("local-only deletion does not make portal requests", async () => {
	const {store, helper} = setup();
	store.dispatch(scheduleAddCustom(plan()));
	const target = store.getState().schedule.baseSchedule[0];
	await deleteScheduleOccurrences(
		helper,
		store,
		target.localId,
		target.activeTime.base[0],
		Choice.ONCE,
		autumn,
	);
	expect(helper.deleteCustomSchedule).not.toHaveBeenCalled();
	expect(helper.getSchedule).not.toHaveBeenCalled();
	expect(store.getState().schedule.baseSchedule).toHaveLength(0);
});

test("missing persisted server IDs are refreshed before sending an exact deletion", async () => {
	const {store, helper} = setup([server([time("2025-09-17")])]);
	helper.getSchedule
		.mockResolvedValueOnce({
			schedule: [server()],
			calendar: {...autumn, semesterName: "秋季", nextSemesterList: []},
		})
		.mockResolvedValueOnce({
			schedule: [],
			calendar: {...autumn, semesterName: "秋季", nextSemesterList: []},
		});
	const target = store.getState().schedule.baseSchedule[0];
	await deleteScheduleOccurrences(
		helper,
		store,
		target.localId,
		target.activeTime.base[0],
		Choice.ONCE,
		autumn,
	);
	expect(helper.getSchedule).toHaveBeenCalledTimes(2);
	expect(
		helper.deleteCustomSchedule.mock.calls[0][0][0].activeTime.base[0].id,
	).toBe(42);
	expect(
		store.getState().schedule.baseSchedule.flatMap((s) => s.activeTime.base),
	).toHaveLength(0);
});

test("server deletion failure retains the occurrence and never becomes a local-only success", async () => {
	const {store, helper} = setup([server()]);
	helper.deleteCustomSchedule.mockRejectedValueOnce(new Error("offline"));
	const target = store.getState().schedule.baseSchedule[0];
	await expect(
		deleteScheduleOccurrences(
			helper,
			store,
			target.localId,
			target.activeTime.base[0],
			Choice.ONCE,
			autumn,
		),
	).rejects.toThrow("offline");
	expect(
		store.getState().schedule.baseSchedule[0].activeTime.base,
	).toHaveLength(1);
});

test("ambiguous same-time personal entries are not deleted without a server ID", async () => {
	const {store, helper} = setup([
		server([time("2025-09-17"), time("2025-09-17")]),
	]);
	helper.getSchedule.mockResolvedValueOnce({
		schedule: [
			server([
				time("2025-09-17", "14:00", "15:00", 1),
				time("2025-09-17", "14:00", "15:00", 2),
			]),
		],
		calendar: {...autumn, semesterName: "秋季", nextSemesterList: []},
	});
	const target = store.getState().schedule.baseSchedule[0];
	await expect(
		deleteScheduleOccurrences(
			helper,
			store,
			target.localId,
			target.activeTime.base[0],
			Choice.ONCE,
			autumn,
		),
	).rejects.toThrow("Cannot identify");
	expect(helper.deleteCustomSchedule).not.toHaveBeenCalled();
});

test("upload clips individual occurrences to this term and retries only unconfirmed dates", async () => {
	const {store, helper} = setup();
	store.dispatch(
		scheduleAddCustom(
			plan([time("2025-09-14"), time("2025-09-17"), time("2025-09-24")]),
		),
	);
	const first = server([time("2025-09-17", "14:00", "15:00", 42)]);
	const second = server([time("2025-09-24", "14:00", "15:00", 43)]);
	const result = (schedule: Schedule[]) => ({
		schedule,
		calendar: {...autumn, semesterName: "秋季", nextSemesterList: []},
	});
	helper.getSchedule
		.mockResolvedValueOnce(result([]))
		.mockResolvedValueOnce(result([first]));
	helper.saveCustomSchedule.mockRejectedValueOnce(new Error("partial failure"));
	await expect(uploadCustomSchedules(helper, store)).rejects.toThrow(
		"partial failure",
	);
	expect(
		helper.saveCustomSchedule.mock.calls[0][0][0].activeTime.base.map((s) =>
			s.beginTime.format("YYYY-MM-DD"),
		),
	).toEqual(["2025-09-17", "2025-09-24"]);
	helper.getSchedule
		.mockResolvedValueOnce(result([first]))
		.mockResolvedValueOnce(result([first, second]));
	await uploadCustomSchedules(helper, store);
	expect(
		helper.saveCustomSchedule.mock.calls[1][0][0].activeTime.base.map((s) =>
			s.beginTime.format("YYYY-MM-DD"),
		),
	).toEqual(["2025-09-24"]);
	expect(
		store
			.getState()
			.schedule.baseSchedule.find((s) => s.type === ScheduleType.CUSTOM)
			?.activeTime.base.map((s) => s.beginTime.format("YYYY-MM-DD")),
	).toEqual(["2025-09-14"]);
});

test("a failed pre-upload refresh cannot cause a duplicate retry", async () => {
	const {store, helper} = setup();
	store.dispatch(scheduleAddCustom(plan()));
	helper.getSchedule.mockRejectedValueOnce(new Error("offline"));
	await expect(uploadCustomSchedules(helper, store)).rejects.toThrow("offline");
	expect(helper.saveCustomSchedule).not.toHaveBeenCalled();
});

test("successful-looking upload response is verified against the personal calendar", async () => {
	const {store, helper} = setup();
	store.dispatch(scheduleAddCustom(plan()));
	await expect(uploadCustomSchedules(helper, store)).rejects.toThrow(
		"could not be confirmed",
	);
	expect(store.getState().schedule.baseSchedule).toHaveLength(1);
});

test("partial upload of identical independent entries consumes each server ID once, including after restart", async () => {
	const {store, helper} = setup();
	store.dispatch(scheduleAddCustom(plan()));
	store.dispatch(scheduleAddCustom(plan()));
	const secondId = store.getState().schedule.baseSchedule[1].localId;
	const result = (schedule: Schedule[]) => ({
		schedule,
		calendar: {...autumn, semesterName: "秋季", nextSemesterList: []},
	});
	helper.getSchedule
		.mockResolvedValueOnce(result([]))
		.mockResolvedValueOnce(result([server()]));
	helper.saveCustomSchedule.mockRejectedValueOnce(new Error("second failed"));
	await expect(uploadCustomSchedules(helper, store)).rejects.toThrow(
		"second failed",
	);
	expect(
		store
			.getState()
			.schedule.baseSchedule.filter((s) => s.type === ScheduleType.CUSTOM)
			.map((s) => s.localId),
	).toEqual([secondId]);
	store.dispatch(
		scheduleSync(
			JSON.parse(JSON.stringify(store.getState().schedule)),
			autumn.firstDay,
			autumn.semesterId,
		),
	);
	helper.getSchedule
		.mockResolvedValueOnce(result([server()]))
		.mockResolvedValueOnce(
			result([
				server([
					time("2025-09-17", "14:00", "15:00", 42),
					time("2025-09-17", "14:00", "15:00", 43),
				]),
			]),
		);
	await uploadCustomSchedules(helper, store);
	expect(helper.saveCustomSchedule.mock.calls[1][0]).toHaveLength(1);
	expect(
		store
			.getState()
			.schedule.baseSchedule.filter((s) => s.type === ScheduleType.CUSTOM),
	).toHaveLength(0);
});

test("an existing identical server entry does not erase a separately added local entry", () => {
	const {store} = setup([server()]);
	store.dispatch(scheduleAddCustom(plan()));
	store.dispatch(
		scheduleFetch({schedule: [server()], semesterId: autumn.semesterId}),
	);
	expect(
		store
			.getState()
			.schedule.baseSchedule.filter((s) => s.type === ScheduleType.CUSTOM),
	).toHaveLength(1);
});
