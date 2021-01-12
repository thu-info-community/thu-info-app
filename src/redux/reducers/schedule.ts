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

export enum Choice {
	ONCE,
	REPEAT,
	ALL,
}

const addToDefaultShortenMap = (
	src: {[key: string]: string},
	...lists: (Lesson | Exam)[][]
) => {
	const dest = {...src};
	lists.forEach((list) => {
		list.forEach((item) => {
			if (!(item.title in src)) {
				dest[item.title] = item.title;
			}
		});
	});
	return dest;
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
			return {
				...state,
				baseSchedule: action.payload,
				cache: Calendar.semesterId,
				refreshing: false,
				shortenMap: {},
				// TODO: fix it
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
				custom: state.custom.concat(action.payload),
			};
		}
		case SCHEDULE_DEL_OR_HIDE: {
			const [lesson, choice] = action.payload;
			if (lesson.type === LessonType.CUSTOM) {
				return {
					...state,
					custom:
						choice === Choice.ALL
							? state.custom.filter((it) => it.title !== lesson.title)
							: state.custom.filter(
									(it) =>
										!(
											it.title === lesson.title &&
											it.begin === lesson.begin &&
											it.end === lesson.end &&
											it.dayOfWeek === lesson.dayOfWeek &&
											(choice === Choice.REPEAT || it.week === lesson.week)
										),
									// eslint-disable-next-line no-mixed-spaces-and-tabs
							  ),
				};
			} else {
				return {
					...state,
					hiddenRules: state.hiddenRules.concat({
						...lesson,
						locale: "",
						week:
							choice === Choice.ALL
								? -1
								: choice === Choice.REPEAT
								? 0
								: lesson.week,
					}),
				};
			}
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
