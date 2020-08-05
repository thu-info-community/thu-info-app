import {Schedule} from "../states/schedule";
import {defaultSchedule} from "../defaults";
import {ScheduleAction} from "../actions/schedule";
import {
	PRIMARY_SCHEDULE_FAILURE,
	PRIMARY_SCHEDULE_REQUEST,
	PRIMARY_SCHEDULE_SUCCESS,
	SCHEDULE_ADD_CUSTOM,
	SCHEDULE_DEL_OR_HIDE,
	SCHEDULE_UPDATE_ALIAS,
	SECONDARY_SCHEDULE_FAILURE,
	SECONDARY_SCHEDULE_REQUEST,
	SECONDARY_SCHEDULE_SUCCESS,
} from "../constants";
import {Calendar} from "../../utils/calendar";
import {Exam, Lesson, LessonType} from "../../models/schedule/schedule";
import {Choice} from "../../ui/schedule/schedule";

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
	state: Schedule = defaultSchedule,
	action: ScheduleAction,
): Schedule => {
	switch (action.type) {
		case PRIMARY_SCHEDULE_REQUEST:
			return {
				...state,
				primaryRefreshing: true,
			};
		case PRIMARY_SCHEDULE_SUCCESS:
			return {
				...state,
				primary: action.payload.primary,
				exam: action.payload.exam,
				cache: Calendar.semesterId,
				shortenMap: addToDefaultShortenMap(
					state.shortenMap,
					action.payload.primary,
					action.payload.exam,
				),
				primaryRefreshing: false,
			};
		case PRIMARY_SCHEDULE_FAILURE:
			return {
				...state,
				primaryRefreshing: false,
			};
		case SECONDARY_SCHEDULE_REQUEST:
			return {
				...state,
				secondaryRefreshing: true,
			};
		case SECONDARY_SCHEDULE_SUCCESS:
			return {
				...state,
				secondary: action.payload.secondary,
				cache: Calendar.semesterId,
				shortenMap: addToDefaultShortenMap(
					state.shortenMap,
					action.payload.secondary,
				),
				secondaryRefreshing: false,
			};
		case SECONDARY_SCHEDULE_FAILURE:
			return {
				...state,
				secondaryRefreshing: false,
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
