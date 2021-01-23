import {Schedules} from "../states/schedule";
import {defaultSchedule} from "../defaults";
import {ScheduleAction} from "../actions/schedule";
import {
	SCHEDULE_FAILURE,
	SCHEDULE_REQUEST,
	SCHEDULE_SUCCESS,
	SCHEDULE_ADD_CUSTOM,
	SCHEDULE_DEL_OR_HIDE,
	SCHEDULE_UPDATE_ALIAS,
	SCHEDULE_REMOVE_HIDDEN_RULE,
} from "../constants";
import {Calendar} from "../../utils/calendar";
import {ScheduleType, Schedule, TimeBlock} from "src/models/schedule/schedule";

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
		case SCHEDULE_SUCCESS:
			let customList: Schedule[] = [];
			state.baseSchedule.forEach((val) => {
				if (val.type === ScheduleType.CUSTOM) {
					customList.push(val);
				}
			});
			return {
				...state,
				baseSchedule: customList.concat(action.payload),
				cache: Calendar.semesterId,
				refreshing: false,
				// shortenMap: {}, // Is it correct?
			};
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
		case SCHEDULE_ADD_CUSTOM: {
			return {
				...state,
				baseSchedule: state.baseSchedule.concat([action.payload]),
			};
		}
		case SCHEDULE_DEL_OR_HIDE: {
			const [title, time, choice] = action.payload;

			const newBaseSchedule: Schedule[] = [];
			const selectedScheduleList: Schedule[] = [];
			state.baseSchedule.forEach((val) => {
				if (val.name === title) {
					selectedScheduleList.push(val);
				} else {
					newBaseSchedule.push(val);
				}
			});
			let selectedSchedule = selectedScheduleList[0];

			const filter = (block: TimeBlock) => {
				if (choice === Choice.ALL) {
					return true;
				} else if (choice === Choice.REPEAT) {
					return (
						block.dayOfWeek === time.dayOfWeek && block.begin === time.begin
					);
				} else {
					return (
						block.week === time.week &&
						block.dayOfWeek === time.dayOfWeek &&
						block.begin === time.begin
					);
				}
			};

			const newActiveBlocks: TimeBlock[] = [];
			const delOrHideBlocks: TimeBlock[] = [];
			selectedSchedule.activeTime.forEach((block) => {
				if (!filter(block)) {
					newActiveBlocks.push(block);
				} else {
					delOrHideBlocks.push(block);
				}
			});
			selectedSchedule = Object.assign(
				{},
				{
					...selectedSchedule,
					activeTime: newActiveBlocks,
					delOrHideTime: delOrHideBlocks,
				},
			);

			return {
				...state,
				baseSchedule:
					newActiveBlocks === [] &&
					selectedSchedule.type === ScheduleType.CUSTOM
						? newBaseSchedule
						: newBaseSchedule.concat([selectedSchedule]),
			};
		}
		case SCHEDULE_REMOVE_HIDDEN_RULE:
			return {
				...state,
				hiddenRules: state.hiddenRules.filter((it) => it !== action.payload),
			};
		default:
			return state;
	}
};
