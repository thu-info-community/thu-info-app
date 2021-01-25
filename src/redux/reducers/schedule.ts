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

const getSelectedSchedule = (
	state: Schedules,
	title: string,
): [Schedule[], Schedule] => {
	let newBaseSchedule: Schedule[] = [];
	let selectedScheduleList: Schedule[] = [];
	state.baseSchedule.forEach((val) => {
		if (val.name === title) {
			selectedScheduleList.push(val);
		} else {
			newBaseSchedule.push(val);
		}
	});
	return [newBaseSchedule, selectedScheduleList[0]];
};

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
				customCnt: state.customCnt + 1,
			};
		}
		case SCHEDULE_DEL_OR_HIDE: {
			const [title, time, choice] = action.payload;
			let [newBaseSchedule, selectedSchedule] = getSelectedSchedule(
				state,
				title,
			);

			const blockFilter = (block: TimeBlock) => {
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

			const newActiveBlocks = selectedSchedule.activeTime.filter(
				(block) => !blockFilter(block),
			);
			selectedSchedule = Object.assign(
				{},
				{
					...selectedSchedule,
					activeTime: newActiveBlocks,
					// week: 0 means ALL, week: -1 means REPEAT
					delOrHideTime: selectedSchedule.delOrHideTime.concat(
						choice === Choice.ONCE
							? [time]
							: choice === Choice.REPEAT
							? [
									{
										...time,
										week: -1,
									},
									// eslint-disable-next-line no-mixed-spaces-and-tabs
							  ]
							: [
									{
										...time,
										week: 0,
									},
									// eslint-disable-next-line no-mixed-spaces-and-tabs
							  ],
					),
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
		case SCHEDULE_REMOVE_HIDDEN_RULE: {
			const [title, time] = action.payload;
			let [newBaseSchedule, selectedSchedule] = getSelectedSchedule(
				state,
				title,
			);

			selectedSchedule = {
				...selectedSchedule,
				delOrHideTime: selectedSchedule.delOrHideTime.filter(
					(val) =>
						val.week !== time.week ||
						val.dayOfWeek !== time.dayOfWeek ||
						val.begin !== time.begin ||
						val.end !== time.end,
				),
			};

			return {
				...state,
				baseSchedule: newBaseSchedule.concat([selectedSchedule]),
			};
		}
		default:
			return state;
	}
};
