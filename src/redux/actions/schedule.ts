import {ActionType, createAsyncAction} from "typesafe-actions";
import {
	SCHEDULE_FAILURE,
	SCHEDULE_REQUEST,
	SCHEDULE_SUCCESS,
	SCHEDULE_ADD_CUSTOM,
	SCHEDULE_REMOVE_HIDDEN_RULE,
	SCHEDULE_DEL_OR_HIDE,
	SCHEDULE_UPDATE_LOCATION,
} from "../constants";
import {Dispatch} from "redux";
import {SCHEDULE_UPDATE_ALIAS} from "../constants";
import {Choice} from "../reducers/schedule";
import {Schedule, TimeBlock} from "thu-info-lib/src/models/schedule/schedule";
import {helper} from "../store";

const scheduleAction = createAsyncAction(
	SCHEDULE_REQUEST,
	SCHEDULE_SUCCESS,
	SCHEDULE_FAILURE,
)<undefined, Schedule[], undefined>();

export type ScheduleAction =
	| ActionType<typeof scheduleAction>
	| {type: typeof SCHEDULE_UPDATE_ALIAS; payload: [string, string]}
	| {type: typeof SCHEDULE_ADD_CUSTOM; payload: Schedule}
	| {type: typeof SCHEDULE_DEL_OR_HIDE; payload: [string, TimeBlock, Choice]}
	| {type: typeof SCHEDULE_REMOVE_HIDDEN_RULE; payload: [string, TimeBlock]}
	| {type: typeof SCHEDULE_UPDATE_LOCATION; payload: [string, string]};

export const scheduleThunk = () => (dispatch: Dispatch<ScheduleAction>) => {
	dispatch(scheduleAction.request());
	helper
		.getSchedule()
		.then((res) => dispatch(scheduleAction.success(res)))
		.catch(() => dispatch(scheduleAction.failure()));
};
