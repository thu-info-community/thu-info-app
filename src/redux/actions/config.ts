import {
	ADD_REPORT_HIDDEN,
	CLEAR_APP_SECRET,
	REMOVE_REPORT_HIDDEN,
	SET_CALENDAR_CONFIG,
	SETUP_APP_SECRET,
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
export const clearAppSecretAction = createAction(CLEAR_APP_SECRET)<undefined>();
export const setupAppSecretAction = createAction(SETUP_APP_SECRET)<undefined>();

const configCustomAction = {
	setCalendarConfigAction,
	addReportHiddenAction,
	removeReportHiddenAction,
	clearAppSecretAction,
	setupAppSecretAction,
};
export type ConfigAction =
	| {[K in keyof Config]: {type: K; payload: Config[K]}}[keyof Config]
	| ActionType<typeof configCustomAction>;
