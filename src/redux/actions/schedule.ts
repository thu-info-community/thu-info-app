import {ActionType, createAction, createAsyncAction} from "typesafe-actions";
import {
	SCHEDULE_FAILURE,
	SCHEDULE_REQUEST,
	SCHEDULE_SUCCESS,
	SCHEDULE_ADD_CUSTOM,
	SCHEDULE_REMOVE_HIDDEN_RULE,
	SCHEDULE_DEL_OR_HIDE,
	SCHEDULE_UPDATE_LOCATION,
	SCHEDULE_CLEAR,
	SCHEDULE_SYNC,
} from "../constants";
import {SCHEDULE_UPDATE_ALIAS} from "../constants";
import {Choice} from "../reducers/schedule";
import {Schedule, TimeSlice} from "thu-info-lib/dist/models/schedule/schedule";
import {Schedules} from "../states/schedule";

export const scheduleFetchAction = createAsyncAction(
	SCHEDULE_REQUEST,
	SCHEDULE_SUCCESS,
	SCHEDULE_FAILURE,
)<undefined, {schedule: Schedule[]; semesterId: string}, undefined>();
export const scheduleUpdateAliasAction = createAction(SCHEDULE_UPDATE_ALIAS)<
	[string, string?]
>();
export const scheduleAddCustomAction =
	createAction(SCHEDULE_ADD_CUSTOM)<Schedule>();
export const scheduleDelOrHideAction =
	createAction(SCHEDULE_DEL_OR_HIDE)<[string, TimeSlice, Choice]>();
export const scheduleRemoveHiddenRuleAction = createAction(
	SCHEDULE_REMOVE_HIDDEN_RULE,
)<[string, TimeSlice]>();
export const scheduleUpdateLocationAction = createAction(
	SCHEDULE_UPDATE_LOCATION,
)<[string, string]>();
export const scheduleClearAction = createAction(SCHEDULE_CLEAR)();
export const scheduleSyncAction = createAction(SCHEDULE_SYNC)<Schedules>();

const scheduleAction = {
	scheduleFetchAction,
	scheduleUpdateAliasAction,
	scheduleAddCustomAction,
	scheduleDelOrHideAction,
	scheduleRemoveHiddenRuleAction,
	scheduleUpdateLocationAction,
	scheduleClearAction,
	scheduleSyncAction,
};
export type ScheduleAction = ActionType<typeof scheduleAction>;
