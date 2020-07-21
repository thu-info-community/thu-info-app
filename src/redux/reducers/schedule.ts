import {Schedule} from "../states/schedule";
import {defaultSchedule} from "../defaults";
import {PrimaryScheduleAction} from "../actions/schedule";
import {PRIMARY_SCHEDULE_SUCCESS} from "../constants";

export const schedule = (
	state: Schedule = defaultSchedule,
	action: PrimaryScheduleAction,
): Schedule => {
	return action.type === PRIMARY_SCHEDULE_SUCCESS ? action.payload : state;
};
