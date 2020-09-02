import {Calendar, SemesterType} from "../../utils/calendar";

export interface Config {
	doNotRemind: number;
	lastSelfVersion: number;
	firstDay: Calendar;
	weekCount: number;
	semesterType: SemesterType;
	semesterId: string;
	graduate: boolean;
}
