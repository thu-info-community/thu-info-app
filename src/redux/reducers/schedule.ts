import {defaultSchedule, Schedules} from "../states/schedule";
import {ScheduleAction} from "../actions/schedule";
import {
	SCHEDULE_FAILURE,
	SCHEDULE_REQUEST,
	SCHEDULE_SUCCESS,
	SCHEDULE_ADD_CUSTOM,
	SCHEDULE_DEL_OR_HIDE,
	SCHEDULE_UPDATE_ALIAS,
	SCHEDULE_REMOVE_HIDDEN_RULE,
	SCHEDULE_UPDATE_LOCATION,
	SCHEDULE_CLEAR,
} from "../constants";
import {
	delOrHide,
	MAX_WEEK_LIST,
	removeDelOrHide,
	Schedule,
	scheduleDeepCopy,
	ScheduleType,
} from "thu-info-lib/dist/models/schedule/schedule";

export enum Choice {
	ONCE,
	REPEAT,
	ALL,
}

export const schedule = (
	state: Schedules = defaultSchedule,
	action: ScheduleAction,
): Schedules => {
	switch (action.type) {
		case SCHEDULE_REQUEST:
			return {
				...state,
				refreshing: true,
			};
		case SCHEDULE_SUCCESS: {
			let customList: Schedule[] = [];
			let newScheduleList: Schedule[] = [];

			// 备份所有自定义计划
			state.baseSchedule.forEach((val) => {
				if (val.type === ScheduleType.CUSTOM) {
					customList.push(val);
				}
			});

			// 以新获取到的课表为基准
			action.payload.schedule.forEach((val) => {
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
			return {
				...state,
				baseSchedule: customList.concat(newScheduleList),
				cache: action.payload.semesterId,
				refreshing: false,
			};
		}
		case SCHEDULE_FAILURE:
			return {
				...state,
				refreshing: false,
			};
		case SCHEDULE_UPDATE_ALIAS: {
			const shortenMap = {...state.shortenMap};
			shortenMap[action.payload[0]] = action.payload[1];
			return {
				...state,
				shortenMap,
			};
		}
		case SCHEDULE_UPDATE_LOCATION: {
			state.baseSchedule.forEach((val) => {
				if (val.name === action.payload[0]) {
					val.location = action.payload[1];
				}
			});
			return {
				...state,
				baseSchedule: state.baseSchedule.map((val) => scheduleDeepCopy(val)),
			};
		}
		case SCHEDULE_ADD_CUSTOM: {
			return {
				...state,
				baseSchedule: state.baseSchedule.concat([action.payload]),
				customCnt: state.customCnt + 1,
			};
		}
		case SCHEDULE_DEL_OR_HIDE: {
			const [title, time, choice] = action.payload;

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

			return {
				...state,
				baseSchedule: state.baseSchedule.map((val) => scheduleDeepCopy(val)),
			};
		}
		case SCHEDULE_REMOVE_HIDDEN_RULE: {
			const [title, time] = action.payload;

			state.baseSchedule.forEach((val) => {
				if (val.name === title) {
					removeDelOrHide(val, time);
				}
			});

			return {
				...state,
				baseSchedule: state.baseSchedule.map((val) => scheduleDeepCopy(val)),
			};
		}
		case "SCHEDULE_SYNC": {
			return {
				...action.payload,
				refreshing: false,
			};
		}
		case SCHEDULE_CLEAR:
			return defaultSchedule;
		default:
			return state;
	}
};
