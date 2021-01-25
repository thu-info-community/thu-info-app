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
			let newScheduleList: Schedule[] = [];
			state.baseSchedule.forEach((val) => {
				if (val.type === ScheduleType.CUSTOM) {
					customList.push(val);
				}
			});
			action.payload.forEach((val) => {
				let selectedScheduleList = state.baseSchedule.filter(
					(item) => item.name === val.name,
				);
				if (selectedScheduleList.length === 0) {
					newScheduleList.push(val);
					return;
				}
				let selectedSchedule = selectedScheduleList[0];
				newScheduleList.push(
					selectedSchedule.delOrHideTime.length === 0
						? val
						: {
								...val,
								activeTime: selectedSchedule.activeTime,
								delOrHideTime: selectedSchedule.delOrHideTime,
								// eslint-disable-next-line no-mixed-spaces-and-tabs
						  },
				);
			});
			return {
				...state,
				baseSchedule: customList.concat(newScheduleList),
				cache: Calendar.semesterId,
				refreshing: false,
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

			let newActiveBlocks: TimeBlock[] = [];
			let hideBlocks: TimeBlock[] = [];
			selectedSchedule.activeTime.forEach((block) => {
				if (blockFilter(block)) {
					hideBlocks.push(block);
				} else {
					newActiveBlocks.push(block);
				}
			});
			selectedSchedule = Object.assign(
				{},
				{
					...selectedSchedule,
					activeTime: newActiveBlocks,
					// week: 0 means ALL, week: -1 means REPEAT
					delOrHideTime:
						choice === Choice.ONCE
							? selectedSchedule.delOrHideTime.concat([time])
							: choice === Choice.REPEAT
							? selectedSchedule.delOrHideTime
									.filter(
										(val) =>
											val.dayOfWeek !== time.dayOfWeek ||
											val.begin !== time.begin,
									)
									.concat([
										{
											...time,
											week: -1,
										},
									])
							: [
									{
										...time,
										week: 0,
									},
									// eslint-disable-next-line no-mixed-spaces-and-tabs
							  ],
					delOrHideDetail: selectedSchedule.delOrHideDetail.concat(hideBlocks),
				},
			);

			return {
				...state,
				baseSchedule:
					newActiveBlocks.length === 0 &&
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

			console.log(time);

			selectedSchedule = {
				...selectedSchedule,
				activeTime:
					time.week === 0
						? selectedSchedule.delOrHideDetail
						: time.week === -1
						? selectedSchedule.activeTime.concat(
								selectedSchedule.delOrHideDetail.filter(
									(val) =>
										val.dayOfWeek === time.dayOfWeek &&
										val.begin === time.begin,
								),
								// eslint-disable-next-line no-mixed-spaces-and-tabs
						  )
						: selectedSchedule.activeTime.concat([time]),
				delOrHideTime: selectedSchedule.delOrHideTime.filter(
					(val) =>
						val.week !== time.week ||
						val.dayOfWeek !== time.dayOfWeek ||
						val.begin !== time.begin ||
						val.end !== time.end,
				),
				delOrHideDetail:
					time.week === 0
						? []
						: time.week === -1
						? selectedSchedule.delOrHideDetail.filter(
								(val) =>
									val.dayOfWeek !== time.dayOfWeek || val.begin !== time.begin,
								// eslint-disable-next-line no-mixed-spaces-and-tabs
						  )
						: selectedSchedule.delOrHideDetail.filter(
								(val) =>
									val.week !== time.week ||
									val.dayOfWeek !== time.dayOfWeek ||
									val.begin !== time.begin ||
									val.end !== time.end,
								// eslint-disable-next-line no-mixed-spaces-and-tabs
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
