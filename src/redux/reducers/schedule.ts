import {Schedule} from "../states/schedule";
import {defaultSchedule} from "../defaults";
import {ScheduleAction} from "../actions/schedule";
import {
	PRIMARY_SCHEDULE_FAILURE,
	PRIMARY_SCHEDULE_REQUEST,
	PRIMARY_SCHEDULE_SUCCESS,
	SCHEDULE_UPDATE_ALIAS,
	SECONDARY_SCHEDULE_FAILURE,
	SECONDARY_SCHEDULE_REQUEST,
	SECONDARY_SCHEDULE_SUCCESS,
} from "../constants";
import {Calendar} from "../../utils/calendar";
import {Exam, Lesson} from "../../models/schedule/schedule";

const addToDefaultShortenMap = (
	src: {[key: string]: string},
	...lists: (Lesson | Exam)[][]
) => {
	const dest = Object.create(src);
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
			const shortenMap = Object.create(state.shortenMap);
			shortenMap[action.payload[0]] = action.payload[1];
			return {
				...state,
				shortenMap,
			};
		}
		default:
			return state;
	}
};
