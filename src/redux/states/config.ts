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
	waterId: string;
	waterBrand: string;
}

export const defaultConfigState: Config = {
	doNotRemindSemver: "0.0.0",
	lastSelfVersion: 0,
	firstDay: Calendar.firstDay,
	weekCount: Calendar.weekCount,
	semesterType: Calendar.semesterType,
	semesterId: Calendar.semesterId,
	newGPA: true,
	bx: false,
	reportHidden: [],
	scheduleHeight: 65,
	lastBroadcast: 0,
	emailName: "",
	emailUnseen: 0,
	waterId: "",
	waterBrand: "6",
};
