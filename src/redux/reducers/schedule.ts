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
} from "../constants";
import {Calendar} from "../../utils/calendar";
import {
	ScheduleType,
	Schedule,
	TimeBlock,
	hideOnce,
} from "src/models/schedule/schedule";

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
			const selectedSchedule: Schedule = state.baseSchedule.filter(
				(val) => val.name === title,
			)[0];
			state.baseSchedule.splice(
				state.baseSchedule.indexOf(selectedSchedule),
				1,
			);
			if (selectedSchedule.type === ScheduleType.CUSTOM) {
				return state;
			}
			const hideBlocks: TimeBlock[] = [];
			const filter = (block: TimeBlock) => {
				if (choice === Choice.ALL) {
					return true;
				} else if (choice === Choice.REPEAT) {
					return (
						block.dayOfWeek === time.dayOfWeek && block.begin === time.begin
					);
				} else {
					return block === time;
				}
			};
			selectedSchedule.activeTime.forEach((block) => {
				if (filter(block)) {
					hideBlocks.push(block);
				}
			});
			hideBlocks.forEach((val) => {
				hideOnce(val, selectedSchedule);
			});
			return {
				...state,
				baseSchedule: state.baseSchedule.concat([selectedSchedule]),
			};
		}
		case "SCHEDULE_REMOVE_HIDDEN_RULE":
			return {
				...state,
				hiddenRules: state.hiddenRules.filter((it) => it !== action.payload),
			};
		default:
			return state;
	}
};
