import {
	ADD_REPORT_HIDDEN,
	REMOVE_REPORT_HIDDEN,
	SET_BX,
	SET_CALENDAR_CONFIG,
	SET_DO_NOT_REMIND,
	SET_EMAIL_NAME,
	SET_LAST_BROADCAST_ID,
	SET_LAST_SELF_VERSION,
	SET_LIB_INTRODUCED,
	SET_NEW_GPA,
	SET_SCHEDULE_HEIGHT,
} from "../constants";
import {store} from "../store";
import {Calendar} from "thu-info-lib/dist/models/schedule/calendar";
import AV from "leancloud-storage/core";

export type CalendarConfig = {
	firstDay: string;
	weekCount: number;
	semesterType: number;
	semesterId: string;
};

export type ConfigAction =
	| {type: typeof SET_DO_NOT_REMIND; payload: string}
	| {type: typeof SET_LAST_SELF_VERSION; payload: number}
	| {type: typeof SET_CALENDAR_CONFIG; payload: CalendarConfig}
	| {type: typeof SET_NEW_GPA; payload: boolean}
	| {type: typeof SET_BX; payload: boolean}
	| {type: typeof ADD_REPORT_HIDDEN; payload: string}
	| {type: typeof REMOVE_REPORT_HIDDEN; payload: string}
	| {type: typeof SET_SCHEDULE_HEIGHT; payload: number}
	| {type: typeof SET_LAST_BROADCAST_ID; payload: number}
	| {type: typeof SET_LIB_INTRODUCED; payload: undefined}
	| {type: typeof SET_EMAIL_NAME; payload: string};

export const refreshCalendarConfig = async () => {
	const payload = (
		await new AV.Query("Config").find()
	)[0].toJSON() as CalendarConfig;
	store.dispatch({
		type: SET_CALENDAR_CONFIG,
		payload,
	});
	Calendar.firstDay = new Calendar(payload.firstDay);
	Calendar.weekCount = payload.weekCount;
	Calendar.semesterType = payload.semesterType;
	Calendar.semesterId = payload.semesterId;
};
