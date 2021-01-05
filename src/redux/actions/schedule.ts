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
import {PrimarySchedule, SecondarySchedule} from "../states/schedule";
import {SCHEDULE_UPDATE_ALIAS} from "../constants";
import {Choice} from "../reducers/schedule";
import {Schedule, TimeBlock} from "../../helper/src/models/schedule/schedule";
import {currState, helper} from "../store";
import {Lesson} from "thu-info-lib/lib/models/schedule/schedule";

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
	| {type: typeof SCHEDULE_REMOVE_HIDDEN_RULE; payload: [string, TimeBlock]};

export const scheduleThunk = () => (dispatch: Dispatch<ScheduleAction>) => {
	dispatch(scheduleAction.request());
	helper.getSchedule()
		.then((res) => dispatch(scheduleAction.success(res)))
		.catch(() => dispatch(scheduleAction.failure()));
};
