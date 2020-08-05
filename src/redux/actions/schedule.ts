import {ActionType, createAsyncAction} from "typesafe-actions";
import {
	PRIMARY_SCHEDULE_FAILURE,
	PRIMARY_SCHEDULE_REQUEST,
	PRIMARY_SCHEDULE_SUCCESS,
	SCHEDULE_ADD_CUSTOM,
	SCHEDULE_REMOVE_HIDDEN_RULE,
	SCHEDULE_DEL_OR_HIDE,
	SECONDARY_SCHEDULE_FAILURE,
	SECONDARY_SCHEDULE_REQUEST,
	SECONDARY_SCHEDULE_SUCCESS,
} from "../constants";
import {Dispatch} from "redux";
import {getSchedule, getSecondary} from "../../network/schedule";
import {PrimarySchedule, SecondarySchedule} from "../states/schedule";
import {SCHEDULE_UPDATE_ALIAS} from "../constants";
import {Lesson} from "../../models/schedule/schedule";
import {Choice} from "../../ui/schedule/schedule";

const primaryScheduleAction = createAsyncAction(
	PRIMARY_SCHEDULE_REQUEST,
	PRIMARY_SCHEDULE_SUCCESS,
	PRIMARY_SCHEDULE_FAILURE,
)<undefined, PrimarySchedule, undefined>();

const secondaryScheduleAction = createAsyncAction(
	SECONDARY_SCHEDULE_REQUEST,
	SECONDARY_SCHEDULE_SUCCESS,
	SECONDARY_SCHEDULE_FAILURE,
)<undefined, SecondarySchedule, undefined>();

export type ScheduleAction =
	| ActionType<typeof primaryScheduleAction>
	| ActionType<typeof secondaryScheduleAction>
	| {type: typeof SCHEDULE_UPDATE_ALIAS; payload: [string, string]}
	| {type: typeof SCHEDULE_ADD_CUSTOM; payload: Lesson[]}
	| {type: typeof SCHEDULE_DEL_OR_HIDE; payload: [Lesson, Choice]}
	| {type: typeof SCHEDULE_REMOVE_HIDDEN_RULE; payload: Lesson};

export const primaryScheduleThunk = () => (
	dispatch: Dispatch<ScheduleAction>,
) => {
	dispatch(primaryScheduleAction.request());
	getSchedule()
		.then((res) =>
			dispatch(primaryScheduleAction.success({primary: res[0], exam: res[1]})),
		)
		.catch(() => dispatch(primaryScheduleAction.failure()));
};

export const secondaryScheduleThunk = () => (
	dispatch: Dispatch<ScheduleAction>,
) => {
	dispatch(secondaryScheduleAction.request());
	getSecondary()
		.then((res) => dispatch(secondaryScheduleAction.success({secondary: res})))
		.catch(() => dispatch(secondaryScheduleAction.failure()));
};
