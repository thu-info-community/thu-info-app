import {
	Calendar,
	SemesterType,
} from "thu-info-lib/lib/models/schedule/calendar";

export interface Config {
	doNotRemind: number;
	doNotRemindSemver: string;
	lastSelfVersion: number;
	firstDay: Calendar;
	weekCount: number;
	semesterType: SemesterType;
	semesterId: string;
	graduate: boolean;
	newGPA: boolean;
	bx: boolean;
	reportHidden: string[];
	scheduleHeight: number;
	remainderShift: number;
	lastBroadcast: number;
}
