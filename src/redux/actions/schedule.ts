import {ActionType, createAsyncAction} from "typesafe-actions";
import {
	PRIMARY_SCHEDULE_FAILURE,
	PRIMARY_SCHEDULE_REQUEST,
	PRIMARY_SCHEDULE_SUCCESS,
	SECONDARY_SCHEDULE_FAILURE,
	SECONDARY_SCHEDULE_REQUEST,
	SECONDARY_SCHEDULE_SUCCESS,
} from "../constants";
import {Dispatch} from "redux";
import {getSchedule, getSecondary} from "../../network/schedule";
import {PrimarySchedule, SecondarySchedule} from "../states/schedule";

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
	| ActionType<typeof secondaryScheduleAction>;

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
