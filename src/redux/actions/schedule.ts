import {ActionType, createAsyncAction} from "typesafe-actions";
import {
	PRIMARY_SCHEDULE_FAILURE,
	PRIMARY_SCHEDULE_REQUEST,
	PRIMARY_SCHEDULE_SUCCESS,
} from "../constants";
import {Schedule} from "../states/schedule";
import {Dispatch} from "redux";
import {getSchedule} from "../../network/schedule";

const primaryScheduleAction = createAsyncAction(
	PRIMARY_SCHEDULE_REQUEST,
	PRIMARY_SCHEDULE_SUCCESS,
	PRIMARY_SCHEDULE_FAILURE,
)<undefined, Schedule, undefined>();

export type PrimaryScheduleAction = ActionType<typeof primaryScheduleAction>;

export const primaryScheduleThunk = () => (
	dispatch: Dispatch<PrimaryScheduleAction>,
) => {
	dispatch(primaryScheduleAction.request());
	getSchedule()
		.then((res) => dispatch(primaryScheduleAction.success({primary: res[0]})))
		.catch(() => dispatch(primaryScheduleAction.failure()));
};
