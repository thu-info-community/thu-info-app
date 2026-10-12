import {createSlice, PayloadAction} from "@reduxjs/toolkit";
import {v4 as uuid} from "uuid";
import {
	Schedule,
	ScheduleType,
	TimeSlice,
	isInSemester,
} from "@thu-info/lib/src/models/schedule/schedule";
import {
	Choice,
	ScheduleState,
	SemesterRange,
	StoredSchedule,
	storeSchedule,
	sameTime,
	sameOccurrence,
	selectOccurrences,
	restoreScheduleState,
	sourceScheduleId,
	serverOccurrenceKey,
} from "../scheduleData";

export type {ScheduleState} from "../scheduleData";
export {Choice} from "../scheduleData";

const initialState: ScheduleState = {
	semesterId: undefined,
	baseSchedule: [],
	shortenMap: {},
	customCnt: 1,
	overrides: {},
	pendingUploads: [],
};

export interface ScheduleEdit {
	localId: string;
	time: TimeSlice;
	choice: Choice;
	range: SemesterRange;
	name: string;
	location: string;
	slices: TimeSlice[];
}

export const scheduleSlice = createSlice({
	name: "schedule",
	initialState,
	reducers: {
		scheduleFetch: (
			state,
			{payload}: PayloadAction<{schedule: Schedule[]; semesterId: string}>,
		) => {
			const incoming = payload.schedule.map((schedule) => {
				// Source identity must not depend on a mutable display location.
				const localId = sourceScheduleId(schedule, payload.semesterId);
				const stored = storeSchedule(
					{...schedule, localId} as StoredSchedule,
					payload.semesterId,
				);
				const override = state.overrides[localId];
				if (override) {
					stored.location = override.location ?? stored.location;
					stored.delOrHideTime = {
						base: override.hidden.base.map((slice) => ({...slice})),
					};
					stored.activeTime.base = stored.activeTime.base.filter(
						(slice) =>
							!override.hidden.base.some((hidden) =>
								sameOccurrence(slice, hidden),
							),
					);
				}
				return stored;
			});
			const custom = state.baseSchedule.filter(
				(s) => s.type === ScheduleType.CUSTOM,
			);
			const consumed = new Set<string>();
			for (const pending of state.pendingUploads) {
				const request = pending.schedule;
				request.activeTime.base = request.activeTime.base.filter((slice) => {
					for (const uploaded of payload.schedule) {
						if (
							uploaded.type !== ScheduleType.PRIMARY ||
							uploaded.category !== "个人日历" ||
							uploaded.name !== request.name ||
							uploaded.location !== request.location
						) {
							continue;
						}
						const found = uploaded.activeTime.base.find(
							(other) =>
								other.id !== undefined &&
								sameTime(slice, other) &&
								!consumed.has(serverOccurrenceKey(uploaded, other)) &&
								!pending.knownOccurrences.includes(
									serverOccurrenceKey(uploaded, other),
								),
						);
						if (!found) {
							continue;
						}
						consumed.add(serverOccurrenceKey(uploaded, found));
						const local = custom.find(
							(s) =>
								s.localId === request.localId &&
								s.name === request.name &&
								s.location === request.location,
						);
						if (local) {
							const index = local.activeTime.base.findIndex((s) =>
								sameTime(s, slice),
							);
							if (index >= 0) {
								local.activeTime.base.splice(index, 1);
							}
							const id = sourceScheduleId(uploaded, payload.semesterId);
							if (state.shortenMap[local.localId] !== undefined) {
								state.shortenMap[id] = state.shortenMap[local.localId];
							}
						}
						return false;
					}
					return true;
				});
			}
			state.pendingUploads = state.pendingUploads.filter(
				(p) => p.schedule.activeTime.base.length > 0,
			);
			for (const pending of state.pendingUploads) {
				pending.knownOccurrences = [
					...new Set([...pending.knownOccurrences, ...consumed]),
				];
			}
			state.semesterId = payload.semesterId;
			state.baseSchedule = [
				...custom.filter((s) => s.activeTime.base.length > 0),
				...incoming,
			];
		},
		scheduleUploadStarted: (
			state,
			{payload}: PayloadAction<StoredSchedule[]>,
		) => {
			const knownOccurrences = state.baseSchedule
				.filter((s) => s.category === "个人日历")
				.flatMap((s) =>
					s.activeTime.base.map((slice) => serverOccurrenceKey(s, slice)),
				);
			state.pendingUploads = state.pendingUploads.filter(
				(p) => !payload.some((s) => s.localId === p.schedule.localId),
			);
			state.pendingUploads.push(
				...payload.map((schedule) => ({
					schedule: storeSchedule(schedule),
					knownOccurrences,
				})),
			);
		},
		scheduleEditDetails: (
			state,
			{
				payload,
			}: PayloadAction<{localId: string; alias?: string; location: string}>,
		) => {
			const schedule = state.baseSchedule.find(
				(s) => s.localId === payload.localId,
			);
			if (!schedule) {
				throw new Error("Schedule changed; refresh and try again");
			}
			state.shortenMap[payload.localId] = payload.alias;
			schedule.location = payload.location;
			if (schedule.type !== ScheduleType.CUSTOM) {
				state.overrides[schedule.localId] = {
					location: payload.location,
					hidden: {
						base: schedule.delOrHideTime.base.map((hidden) => ({...hidden})),
					},
				};
			}
		},
		scheduleAddCustom: {
			prepare: (schedule: Schedule) => ({payload: storeSchedule(schedule)}),
			reducer: (state, {payload}: PayloadAction<StoredSchedule>) => {
				state.baseSchedule.push(payload);
				state.customCnt++;
			},
		},
		scheduleEditCustom: {
			prepare: (edit: ScheduleEdit) => ({
				payload: {...edit, replacementId: `custom:${uuid()}`},
			}),
			reducer: (
				state,
				{payload}: PayloadAction<ScheduleEdit & {replacementId: string}>,
			) => {
				const schedule = state.baseSchedule.find(
					(s) =>
						s.localId === payload.localId && s.type === ScheduleType.CUSTOM,
				);
				if (
					!schedule ||
					!schedule.activeTime.base.some((s) => sameOccurrence(s, payload.time))
				) {
					throw new Error("Schedule changed; refresh and try again");
				}
				const selected = selectOccurrences(
					schedule,
					payload.time,
					payload.choice,
					payload.range,
				);
				if (
					!selected.length ||
					!payload.slices.length ||
					payload.slices.some(
						(slice) =>
							!isInSemester(
								slice.beginTime,
								payload.range.firstDay,
								payload.range.weekCount,
							) || !slice.endTime.isAfter(slice.beginTime),
					)
				) {
					throw new Error("Invalid schedule edit");
				}
				const remaining = schedule.activeTime.base.filter(
					(slice) => !selected.includes(slice),
				);
				const replacement: StoredSchedule = {
					...schedule,
					localId: remaining.length ? payload.replacementId : schedule.localId,
					name: payload.name || schedule.name,
					location: payload.location,
					activeTime: {base: payload.slices.map((slice) => ({...slice}))},
					delOrHideTime: {base: []},
				};
				// The edited subset is independent; untouched dates keep all fields.
				if (remaining.length) {
					schedule.activeTime.base = remaining;
					state.baseSchedule.push(replacement);
				} else {
					state.baseSchedule[state.baseSchedule.indexOf(schedule)] =
						replacement;
				}
				delete state.shortenMap[replacement.localId];
			},
		},
		scheduleDelOrHide: (
			state,
			{payload}: PayloadAction<[string, TimeSlice, Choice, SemesterRange]>,
		) => {
			const [localId, time, choice, range] = payload;
			const schedule = state.baseSchedule.find((s) => s.localId === localId);
			if (!schedule) {
				return;
			}
			const selected = selectOccurrences(schedule, time, choice, range);
			schedule.activeTime.base = schedule.activeTime.base.filter(
				(slice) => !selected.includes(slice),
			);
			if (
				schedule.type !== ScheduleType.CUSTOM &&
				schedule.category !== "个人日历"
			) {
				for (const slice of selected) {
					if (
						!schedule.delOrHideTime.base.some((hidden) =>
							sameOccurrence(hidden, slice),
						)
					) {
						schedule.delOrHideTime.base.push(slice);
					}
				}
				state.overrides[localId] = {
					...state.overrides[localId],
					hidden: {
						base: schedule.delOrHideTime.base.map((hidden) => ({...hidden})),
					},
				};
			}
			state.baseSchedule = state.baseSchedule.filter(
				(s) =>
					s.localId !== localId ||
					s.type !== ScheduleType.CUSTOM ||
					s.activeTime.base.length > 0,
			);
		},
		scheduleRemoveHiddenRule: (
			state,
			{payload}: PayloadAction<[string, TimeSlice]>,
		) => {
			const [localId, time] = payload;
			const schedule = state.baseSchedule.find((s) => s.localId === localId);
			if (!schedule) {
				return;
			}
			const index = schedule.delOrHideTime.base.findIndex((s) =>
				sameOccurrence(s, time),
			);
			if (index < 0) {
				return;
			}
			const [slice] = schedule.delOrHideTime.base.splice(index, 1);
			if (!schedule.activeTime.base.some((s) => sameOccurrence(s, slice))) {
				schedule.activeTime.base.push(slice);
			}
			state.overrides[localId] = {
				...state.overrides[localId],
				hidden: {
					base: schedule.delOrHideTime.base.map((hidden) => ({...hidden})),
				},
			};
		},
		scheduleSync: {
			prepare: (raw: unknown, firstDay?: string, semesterId?: string) => ({
				payload: restoreScheduleState(raw, firstDay, semesterId),
			}),
			reducer: (_state, {payload}: PayloadAction<ScheduleState>) => payload,
		},
		scheduleClear: () => initialState,
	},
});

export const {
	scheduleFetch,
	scheduleEditDetails,
	scheduleAddCustom,
	scheduleEditCustom,
	scheduleUploadStarted,
	scheduleDelOrHide,
	scheduleRemoveHiddenRule,
	scheduleSync,
	scheduleClear,
} = scheduleSlice.actions;
export const scheduleReducer = scheduleSlice.reducer;
