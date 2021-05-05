import {
	Calendar,
	SemesterType,
} from "thu-info-lib/dist/models/schedule/calendar";

export interface Config {
	doNotRemind: number;
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
	libIntroduced: boolean;
	emailName: string;
}
