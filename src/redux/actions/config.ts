import {
	ADD_REPORT_HIDDEN,
	REMOVE_REPORT_HIDDEN,
	SET_CALENDAR_CONFIG,
} from "../constants";
import {Config} from "../states/config";
import {ActionType, createAction} from "typesafe-actions";

export type CalendarConfig = {
	firstDay: string;
	weekCount: number;
	semesterId: string;
};

export const configSet = <T extends keyof Config, S extends Config[T]>(
	item: T,
	value: S,
) => ({
	type: item,
	payload: value,
});

export const setCalendarConfigAction =
	createAction(SET_CALENDAR_CONFIG)<CalendarConfig>();
export const addReportHiddenAction = createAction(ADD_REPORT_HIDDEN)<string>();
export const removeReportHiddenAction =
	createAction(REMOVE_REPORT_HIDDEN)<string>();

const configCustomAction = {
	setCalendarConfigAction,
	addReportHiddenAction,
	removeReportHiddenAction,
};
export type ConfigAction =
	| {[K in keyof Config]: {type: K; payload: Config[K]}}[keyof Config]
	| ActionType<typeof configCustomAction>;
