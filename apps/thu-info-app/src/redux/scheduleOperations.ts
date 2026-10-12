import type {Dispatch, UnknownAction} from "redux";
import type {InfoHelper} from "@thu-info/lib";
import {
	ScheduleType,
	TimeSlice,
} from "@thu-info/lib/src/models/schedule/schedule";
import {
	Choice,
	ScheduleState,
	SemesterRange,
	schedulesInSemester,
	selectOccurrences,
} from "./scheduleData";
import {
	scheduleDelOrHide,
	scheduleFetch,
	scheduleUploadStarted,
} from "./slices/schedule";

type ScheduleStore = {
	getState: () => {
		schedule: ScheduleState;
		config: SemesterRange & {semesterId: string; nextSemesterIndex?: number};
	};
	dispatch: Dispatch<UnknownAction>;
};
type ScheduleHelper = Pick<
	InfoHelper,
	"getSchedule" | "deleteCustomSchedule" | "saveCustomSchedule"
>;

const requestVersions = new WeakMap<object, number>();
export const beginScheduleRequest = (store: object) => {
	const version = (requestVersions.get(store) ?? 0) + 1;
	requestVersions.set(store, version);
	return version;
};
export const isLatestScheduleRequest = (store: object, version: number) =>
	requestVersions.get(store) === version;

const refresh = async (helper: ScheduleHelper, store: ScheduleStore) => {
	const config = store.getState().config;
	const version = beginScheduleRequest(store);
	const result = await helper.getSchedule(config.nextSemesterIndex);
	const semester =
		result.calendar.nextSemesterList[config.nextSemesterIndex ?? -1] ??
		result.calendar;
	const current = store.getState().config;
	if (
		!isLatestScheduleRequest(store, version) ||
		current.semesterId !== config.semesterId ||
		current.nextSemesterIndex !== config.nextSemesterIndex ||
		semester.semesterId !== config.semesterId
	) {
		throw new Error("Semester changed; refresh and try again");
	}
	store.dispatch(
		scheduleFetch({schedule: result.schedule, semesterId: semester.semesterId}),
	);
	return result.schedule;
};

export const deleteScheduleOccurrences = async (
	helper: ScheduleHelper,
	store: ScheduleStore,
	localId: string,
	time: TimeSlice,
	choice: Choice,
	range: SemesterRange,
) => {
	let schedule = store
		.getState()
		.schedule.baseSchedule.find((s) => s.localId === localId);
	if (!schedule) {
		throw new Error("Schedule changed; refresh and try again");
	}
	if (
		schedule.category === "个人日历" &&
		schedule.type === ScheduleType.PRIMARY
	) {
		let selected = selectOccurrences(schedule, time, choice, range);
		if (selected.some((slice) => !slice.id)) {
			await refresh(helper, store);
			schedule = store
				.getState()
				.schedule.baseSchedule.find((s) => s.localId === localId);
			if (!schedule) {
				throw new Error("Schedule changed; refresh and try again");
			}
			selected = selectOccurrences(schedule, time, choice, range);
		}
		if (
			!selected.length ||
			selected.some((slice) => !slice.id) ||
			(choice === Choice.ONCE && selected.length !== 1)
		) {
			throw new Error(
				"Cannot identify personal calendar occurrence; refresh and try again",
			);
		}
		try {
			beginScheduleRequest(store);
			await helper.deleteCustomSchedule([
				{...schedule, activeTime: {base: selected}},
			]);
			const fetched = await refresh(helper, store);
			if (
				fetched.some(
					(s) =>
						s.category === "个人日历" &&
						s.activeTime.base.some((slice) =>
							selected.some((target) => target.id === slice.id),
						),
				)
			) {
				throw new Error(
					"Personal calendar deletion could not be confirmed; refresh and try again",
				);
			}
		} catch (error) {
			// A batch can fail after deleting some occurrences. Reconcile before retry.
			await refresh(helper, store).catch(() => {});
			throw error;
		}
	}
	store.dispatch(scheduleDelOrHide([localId, time, choice, range]));
};

export const uploadCustomSchedules = async (
	helper: ScheduleHelper,
	store: ScheduleStore,
) => {
	// Always reconcile before retrying a batch, including after an earlier timeout.
	await refresh(helper, store);
	const state = store.getState();
	const schedules = schedulesInSemester(
		state.schedule.baseSchedule.filter((s) => s.type === ScheduleType.CUSTOM),
		state.config,
	);
	if (!schedules.length) {
		return;
	}
	store.dispatch(scheduleUploadStarted(schedules));
	try {
		await helper.saveCustomSchedule(schedules);
	} catch (error) {
		await refresh(helper, store).catch(() => {});
		throw error;
	}
	await refresh(helper, store);
	if (
		store
			.getState()
			.schedule.pendingUploads.some((pending) =>
				schedules.some((s) => s.localId === pending.schedule.localId),
			)
	) {
		throw new Error(
			"Personal calendar upload could not be confirmed; refresh and try again",
		);
	}
};
