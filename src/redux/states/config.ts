import {
	Calendar,
	SemesterType,
} from "thu-info-lib/dist/models/schedule/calendar";

export interface Config {
	doNotRemindSemver: string;
	lastSelfVersion: number;
	firstDay: Calendar;
	weekCount: number;
	semesterType: SemesterType;
	semesterId: string;
	newGPA: boolean;
	bx: boolean;
	reportHidden: string[];
	scheduleHeight: number;
	lastBroadcast: number;
	emailName: string;
	emailUnseen: number;
}
