import {
	SET_CALENDAR_CONFIG,
	SET_DO_NOT_REMIND,
	SET_LAST_SELF_VERSION,
} from "../constants";
import {retrieve} from "../../network/core";
import {CALENDAR_CONFIG_URL} from "../../constants/strings";
import {store} from "../store";
import {Calendar} from "../../utils/calendar";

export type CalendarConfig = {
	firstDay: string;
	weekCount: number;
	semesterType: number;
	semesterId: string;
};

export type ConfigAction =
	| {type: typeof SET_DO_NOT_REMIND; payload: number}
	| {type: typeof SET_LAST_SELF_VERSION; payload: number}
	| {type: typeof SET_CALENDAR_CONFIG; payload: CalendarConfig};

export const refreshCalendarConfig = () => {
	retrieve(CALENDAR_CONFIG_URL).then((s) => {
		const payload = JSON.parse(s) as CalendarConfig;
		store.dispatch({
			type: SET_CALENDAR_CONFIG,
			payload,
		});
		Calendar.firstDay = new Calendar(payload.firstDay);
		Calendar.weekCount = payload.weekCount;
		Calendar.semesterType = payload.semesterType;
		Calendar.semesterId = payload.semesterId;
	});
};
