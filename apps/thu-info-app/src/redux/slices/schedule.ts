import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import dayjs from "dayjs";
import {
	ImportMode, ImportRange, ImportRecord, classifyImportRecords,
	isInImportRange, mergeImportRanges, scheduleRecords,
} from "../../utils/scheduleImportData";
import {
	delOrHide,
	removeDelOrHide,
	Schedule,
	ScheduleTime,
	TimeSlice,
	ScheduleType,
	scheduleTimeAdd,
} from "@thu-info/lib/src/models/schedule/schedule";

export interface ScheduleState {
	semesterId: string | undefined;
	baseSchedule: Schedule[];
	shortenMap: {[key: string]: string | undefined};
	customCnt: number;
	/** Optional for compatibility with persisted state and older sync senders. */
	replacementRanges?: ImportRange[];
}

const initialState: ScheduleState = {
	semesterId: undefined,
	baseSchedule: [],
	shortenMap: {},
	customCnt: 1,
	replacementRanges: [],
};

export enum Choice {
	ONCE,
	REPEAT,
	ALL,
}

const addCustomSchedule = (state: ScheduleState, payload: Schedule) => {
	if (payload.type !== ScheduleType.CUSTOM) {
		state.baseSchedule.push(payload);
		return;
	}
	const existing = state.baseSchedule.find((s) => s.type === ScheduleType.CUSTOM &&
		s.name === payload.name && s.location === payload.location);
	if (existing) {
		payload.activeTime.base.forEach((slice) => {
			if (!existing.activeTime.base.some((s) => s.beginTime.valueOf() === slice.beginTime.valueOf() &&
				s.endTime.valueOf() === slice.endTime.valueOf())) {
				scheduleTimeAdd(existing.activeTime, slice);
			}
		});
	} else {
		state.baseSchedule.push(payload);
		state.customCnt += 1;
	}
};

export const scheduleSlice = createSlice({
	name: "schedule",
	initialState,
	reducers: {
		scheduleFetch: (
			state,
			{
				payload,
			}: PayloadAction<{
				schedule: Schedule[];
				semesterId: string;
			}>,
		) => {
			let customList: Schedule[] = [];
			let newScheduleList: Schedule[] = [];

			// 备份所有自定义计划
			state.baseSchedule.forEach((val) => {
				if (val.type === ScheduleType.CUSTOM) {
					customList.push(val);
				}
			});

			// 以新获取到的课表为基准
			const fetched = payload.schedule.map((schedule) => ({
				...schedule,
				activeTime: {base: schedule.activeTime.base.filter((slice) =>
					!(state.replacementRanges ?? []).some((range) => isInImportRange(slice.beginTime.valueOf(), range)))},
			}));
			fetched.forEach((val) => {
				const selectedScheduleList = state.baseSchedule.filter(
					(item) => item.hash === val.hash,
				);

				if (selectedScheduleList.length === 0) {
					newScheduleList.push(val);
					return;
				}

				const selectedSchedule = selectedScheduleList[0];

				const mergedSchedule: Schedule = {
					name: selectedSchedule.name,
					location: selectedSchedule.location,
					type: val.type,
					hash: val.hash,
					category: val.category,
					activeTime: val.activeTime,
					delOrHideTime: selectedSchedule.delOrHideTime,
				};

				// 合并之后需要手动删除隐藏的时间片
				selectedSchedule.delOrHideTime.base.forEach((slice) => {
					delOrHide(val, slice);
				});

				newScheduleList.push(mergedSchedule);
			});

			// 对自定义计划去掉在新课表中完全重合的时间片
			const filteredCustomList: Schedule[] = [];
			customList.forEach((custom) => {
				// 只处理自定义计划，防止未来 customList 构造方式变更
				if (custom.type !== ScheduleType.CUSTOM) {
					filteredCustomList.push(custom);
					return;
				}

				const plainName = custom.name;
				const remainingSlices = custom.activeTime.base.filter((slice) => {
					const overlapped = fetched.some((sch) => {
						if (sch.name !== plainName || sch.location !== custom.location) {
							return false;
						}
						return sch.activeTime.base.some(
							(t) =>
								t.dayOfWeek === slice.dayOfWeek &&
								t.beginTime.isSame(slice.beginTime, "minute") &&
								t.endTime.isSame(slice.endTime, "minute"),
						);
					});
					// overlapped === true 表示有完全相同的官方时间片，需要删掉
					return !overlapped;
				});

				// 如果这个自定义计划的时间片都被删光了，则整体删除该自定义计划
				if (remainingSlices.length > 0) {
					custom.activeTime.base = remainingSlices;
					filteredCustomList.push(custom);
				}
			});

			state.semesterId = payload.semesterId;
			state.baseSchedule = filteredCustomList.concat(newScheduleList);
		},
		scheduleUpdateAlias: (
			state,
			{payload}: PayloadAction<[string, string?]>,
		) => {
			state.shortenMap[payload[0]] = payload[1];
		},
		scheduleUpdateLocation: (
			state,
			{payload}: PayloadAction<[string, string]>,
		) => {
			state.baseSchedule.forEach((val) => {
				if (val.name === payload[0]) {
					val.location = payload[1];
				}
			});
		},
		scheduleAddCustom: (state, {payload}: PayloadAction<Schedule>) => {
			addCustomSchedule(state, payload);
		},
		scheduleImportCustomBatch: (state, {payload}: PayloadAction<{
			records: ImportRecord[]; mode: ImportMode; range: ImportRange;
		}>) => {
			const {records, mode, range} = payload;
			// Validate the entire batch before a replacement can remove anything.
			if (!records.length || records.length > 5000 || !Number.isFinite(range.start) ||
				!Number.isFinite(range.end) || range.end <= range.start ||
				!records.every((r) => r.name.trim() && Number.isFinite(r.start) && Number.isFinite(r.end) &&
					r.end > r.start && isInImportRange(r.start, range) && dayjs(r.start).isSame(dayjs(r.end), "day"))) {
				return;
			}
			if (mode === "replace") {
				state.replacementRanges = mergeImportRanges([...(state.replacementRanges ?? []), range]);
				state.baseSchedule.forEach((schedule) => {
					schedule.activeTime.base = schedule.activeTime.base.filter((slice) => !isInImportRange(slice.beginTime.valueOf(), range));
					if (schedule.type === ScheduleType.CUSTOM) {
						schedule.delOrHideTime.base = schedule.delOrHideTime.base.filter((slice) => !isInImportRange(slice.beginTime.valueOf(), range));
					}
				});
				state.baseSchedule = state.baseSchedule.filter((s) => s.type !== ScheduleType.CUSTOM || s.activeTime.base.length > 0);
			}
			const classified = classifyImportRecords(records, scheduleRecords(state.baseSchedule));
			classified.filter((r) => r.status !== "duplicate").forEach((record) => {
				const beginTime = dayjs(record.start);
				addCustomSchedule(state, {
					name: record.name.trim(), location: record.location.trim(), type: ScheduleType.CUSTOM,
					hash: "", delOrHideTime: {base: []},
					activeTime: {base: [{dayOfWeek: beginTime.day() || 7, beginTime, endTime: dayjs(record.end)}]},
				});
			});
		},
		scheduleClearImportOverrides: (state) => {
			// Caller fetches successfully before clearing, then dispatches scheduleFetch.
			state.replacementRanges = [];
		},
		scheduleDelOrHide: (
			state,
			{payload}: PayloadAction<[string, TimeSlice, Choice]>,
		) => {
			const [title, time, choice] = payload;

			// 如果自定义计划没有活跃时间片了则直接删除
			let wastedCustom = false;
			state.baseSchedule.forEach((val) => {
				if (val.name === title) {
					switch (choice) {
						case Choice.ONCE: {
							delOrHide(val, time);
							break;
						}
						case Choice.REPEAT: {
							const matchingSlices = val.activeTime.base.filter((slice) =>
								slice.dayOfWeek === time.dayOfWeek &&
								slice.beginTime.format("HH:mm") === time.beginTime.format("HH:mm") &&
								slice.endTime.format("HH:mm") === time.endTime.format("HH:mm")
							);
							matchingSlices.forEach((slice) => {
								delOrHide(val, slice);
							});
							break;
						}
						case Choice.ALL: {
							const timeSliceList = [...val.activeTime.base];
							timeSliceList.forEach((slice) => {
								delOrHide(val, slice);
							});
							break;
						}
						default:
							break;
					}

					wastedCustom =
						val.type === ScheduleType.CUSTOM &&
						val.activeTime.base.length === 0;
				}
			});

			if (wastedCustom) {
				state.baseSchedule = state.baseSchedule.filter(
					(val) => val.name !== title,
				);
			}
		},
		scheduleRemoveHiddenRule: (
			state,
			{payload}: PayloadAction<[string, TimeSlice]>,
		) => {
			const [title, time] = payload;

			state.baseSchedule.forEach((val) => {
				if (val.name === title) {
					removeDelOrHide(val, time);
				}
			});
		},
		scheduleUpdateCustomTime: (
			state,
			{payload}: PayloadAction<[string, ScheduleTime]>,
		) => {
			const [title, newActiveTime] = payload;
			state.baseSchedule.forEach((val) => {
				if (val.name === title && val.type === ScheduleType.CUSTOM) {
					val.activeTime = newActiveTime;
					// Reset delOrHideTime since existing hide rules are tied to old time slots
					// and become invalid after the time slots are replaced
					val.delOrHideTime = {base: []};
				}
			});
		},
		scheduleSync: (state, {payload}: PayloadAction<ScheduleState>) => {
			state.baseSchedule = payload.baseSchedule;
			state.customCnt = payload.customCnt;
			state.shortenMap = payload.shortenMap;
			state.replacementRanges = payload.replacementRanges ?? [];
		},
		scheduleClear: (state) => {
			state.baseSchedule = [];
			state.customCnt = 1;
			state.shortenMap = {};
			state.replacementRanges = [];
		},
	},
});

export const {
	scheduleFetch,
	scheduleUpdateAlias,
	scheduleUpdateLocation,
	scheduleAddCustom,
	scheduleImportCustomBatch,
	scheduleClearImportOverrides,
	scheduleDelOrHide,
	scheduleRemoveHiddenRule,
	scheduleUpdateCustomTime,
	scheduleSync,
	scheduleClear,
} = scheduleSlice.actions;

export const scheduleReducer = scheduleSlice.reducer;
