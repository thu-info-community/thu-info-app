import {Schedule} from "../states/schedule";
import {defaultSchedule} from "../defaults";
import {ScheduleAction} from "../actions/schedule";
import {
	PRIMARY_SCHEDULE_SUCCESS,
	SECONDARY_SCHEDULE_SUCCESS,
} from "../constants";

export const schedule = (
	state: Schedule = defaultSchedule,
	action: ScheduleAction,
): Schedule => {
	switch (action.type) {
		case PRIMARY_SCHEDULE_SUCCESS:
			return {
				...state,
				primary: action.payload.primary,
				exam: action.payload.exam,
			};
		case SECONDARY_SCHEDULE_SUCCESS:
			return {
				...state,
				secondary: action.payload.secondary,
			};
		default:
			return state;
	}
};
