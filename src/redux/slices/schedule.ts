import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import {
	delOrHide,
	MAX_WEEK_LIST,
	removeDelOrHide,
	Schedule,
	TimeSlice,
	ScheduleType,
} from "thu-info-lib/dist/models/schedule/schedule";

export interface ScheduleState {
	semesterId: string | undefined;
	baseSchedule: Schedule[];
	shortenMap: {[key: string]: string | undefined};
	customCnt: number;
}

const initialState: ScheduleState = {
	semesterId: undefined,
	baseSchedule: [],
	shortenMap: {},
	customCnt: 1,
};

export enum Choice {
	ONCE,
	REPEAT,
	ALL,
}

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
			if (
				state.semesterId === undefined ||
				state.semesterId === payload.semesterId
			) {
				state.baseSchedule.forEach((val) => {
					if (val.type === ScheduleType.CUSTOM) {
						customList.push(val);
					}
				});
			}

			// 以新获取到的课表为基准
			payload.schedule.forEach((val) => {
				let selectedScheduleList = state.baseSchedule.filter(
					(item) => item.name === val.name,
				);

				if (selectedScheduleList.length === 0) {
					newScheduleList.push(val);
					return;
				}

				let selectedSchedule = selectedScheduleList[0];
				selectedSchedule.delOrHideTime.base.forEach((slice) => {
					delOrHide(val, slice);
				});
				val.location = selectedSchedule.location;
				newScheduleList.push(val);
			});

			state.semesterId = payload.semesterId;
			state.baseSchedule = customList.concat(newScheduleList);
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
			state.baseSchedule.push(payload);
			state.customCnt += 1;
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
							delOrHide(val, {
								...time,
								activeWeeks: MAX_WEEK_LIST,
							});
							break;
						}
						case Choice.ALL: {
							const timeSliceList = val.activeTime.base;
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
		scheduleSync: (state, {payload}: PayloadAction<ScheduleState>) => {
			state.baseSchedule = payload.baseSchedule;
			state.customCnt = payload.customCnt;
			state.shortenMap = payload.shortenMap;
		},
		scheduleClear: (state) => {
			state.baseSchedule = [];
			state.customCnt = 1;
			state.shortenMap = {};
		},
	},
});

export const {
	scheduleFetch,
	scheduleUpdateAlias,
	scheduleUpdateLocation,
	scheduleAddCustom,
	scheduleDelOrHide,
	scheduleRemoveHiddenRule,
	scheduleSync,
	scheduleClear,
} = scheduleSlice.actions;

export const scheduleReducer = scheduleSlice.reducer;
