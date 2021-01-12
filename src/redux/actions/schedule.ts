import {ActionType, createAsyncAction} from "typesafe-actions";
import {
	SCHEDULE_FAILURE,
	SCHEDULE_REQUEST,
	SCHEDULE_SUCCESS,
	SCHEDULE_ADD_CUSTOM,
	SCHEDULE_REMOVE_HIDDEN_RULE,
	SCHEDULE_DEL_OR_HIDE,
} from "../constants";
import {Dispatch} from "redux";
import {getSchedule} from "../../network/schedule";
import {SCHEDULE_UPDATE_ALIAS} from "../constants";
import {Choice} from "../reducers/schedule";
import {Schedule} from "src/models/schedule/schedule";

const scheduleAction = createAsyncAction(
	SCHEDULE_REQUEST,
	SCHEDULE_SUCCESS,
	SCHEDULE_FAILURE,
)<undefined, Schedule[], undefined>();

export type ScheduleAction =
	| ActionType<typeof scheduleAction>
	| {type: typeof SCHEDULE_UPDATE_ALIAS; payload: [string, string]}
	| {type: typeof SCHEDULE_ADD_CUSTOM; payload: Lesson[]}
	| {type: typeof SCHEDULE_DEL_OR_HIDE; payload: [Lesson, Choice]}
	| {type: typeof SCHEDULE_REMOVE_HIDDEN_RULE; payload: Lesson};

export const scheduleThunk = () => (dispatch: Dispatch<ScheduleAction>) => {
	dispatch(scheduleAction.request());
	getSchedule()
		.then((res) => dispatch(scheduleAction.success(res)))
		.catch(() => dispatch(scheduleAction.failure()));
};
