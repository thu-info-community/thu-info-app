import dayjs from "dayjs";

export interface Config {
	doNotRemindSemver: string;
	lastSelfVersion: number;
	firstDay: dayjs.Dayjs;
	weekCount: number;
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
	firstDay: dayjs("2021-09-13"),
	weekCount: 18,
	semesterId: "2021-2022-1",
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
