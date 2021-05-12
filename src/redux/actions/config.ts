import {
	ADD_REPORT_HIDDEN,
	REMOVE_REPORT_HIDDEN,
	SET_CALENDAR_CONFIG,
} from "../constants";
import {store} from "../store";
import {Calendar} from "thu-info-lib/dist/models/schedule/calendar";
import AV from "leancloud-storage/core";
import {Config} from "../states/config";
import {ActionType, createAction} from "typesafe-actions";

export type CalendarConfig = {
	firstDay: string;
	weekCount: number;
	semesterType: number;
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

export const refreshCalendarConfig = async () => {
	const payload = (
		await new AV.Query("Config").find()
	)[0].toJSON() as CalendarConfig;
	store.dispatch(setCalendarConfigAction(payload));
	Calendar.firstDay = new Calendar(payload.firstDay);
	Calendar.weekCount = payload.weekCount;
	Calendar.semesterType = payload.semesterType;
	Calendar.semesterId = payload.semesterId;
};
