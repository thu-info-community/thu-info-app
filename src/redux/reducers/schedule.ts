import {Schedule} from "../states/schedule";
import {defaultSchedule} from "../defaults";
import {ScheduleAction} from "../actions/schedule";
import {
	PRIMARY_SCHEDULE_FAILURE,
	PRIMARY_SCHEDULE_REQUEST,
	PRIMARY_SCHEDULE_SUCCESS,
	SECONDARY_SCHEDULE_FAILURE,
	SECONDARY_SCHEDULE_REQUEST,
	SECONDARY_SCHEDULE_SUCCESS,
} from "../constants";
import {Calendar} from "../../utils/calendar";

export const schedule = (
	state: Schedule = defaultSchedule,
	action: ScheduleAction,
): Schedule => {
	switch (action.type) {
		case PRIMARY_SCHEDULE_REQUEST: {
			return {
				...state,
				primaryRefreshing: true,
			};
		}
		case PRIMARY_SCHEDULE_SUCCESS:
			return {
				...state,
				primary: action.payload.primary,
				exam: action.payload.exam,
				cache: Calendar.semesterId,
				primaryRefreshing: false,
			};
		case PRIMARY_SCHEDULE_FAILURE: {
			return {
				...state,
				primaryRefreshing: false,
			};
		}
		case SECONDARY_SCHEDULE_REQUEST: {
			return {
				...state,
				secondaryRefreshing: true,
			};
		}
		case SECONDARY_SCHEDULE_SUCCESS:
			return {
				...state,
				secondary: action.payload.secondary,
				cache: Calendar.semesterId,
				secondaryRefreshing: false,
			};
		case SECONDARY_SCHEDULE_FAILURE: {
			return {
				...state,
				secondaryRefreshing: false,
			};
		}
		default:
			return state;
	}
};
