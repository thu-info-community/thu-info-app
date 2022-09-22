import dayjs from "dayjs";
import {HomeFunction} from "src/ui/home/home";

export interface Config {
	doNotRemindSemver: string;
	lastSelfVersion: number;
	firstDay: dayjs.Dayjs;
	weekCount: number;
	semesterId: string;
	language: string;
	darkMode: boolean;
	newGPA: boolean;
	bx: boolean;
	reportHidden: string[];
	scheduleHeight: number;
	lastBroadcast: number;
	emailName: string;
	emailUnseen: number;
	waterId: string;
	waterBrand: string;
	appSecretLockMinutes: number | undefined;
	verifyPasswordBeforeEnterApp: boolean | undefined;
	verifyPasswordBeforeEnterReport: boolean | undefined;
	verifyPasswordBeforeEnterFinance: boolean | undefined;
	verifyPasswordBeforeEnterPhysicalExam: boolean | undefined;
	useBiometrics: boolean | undefined;
	appLocked: boolean | undefined;
	exitTimestamp: number | undefined;
	subFunctionUnlocked: boolean | undefined;
	homeFunctionDisabled: HomeFunction[];
}

export const defaultConfigState: Config = {
	doNotRemindSemver: "0.0.0",
	lastSelfVersion: 0,
	firstDay: dayjs("2021-09-13"),
	weekCount: 18,
	semesterId: "2021-2022-1",
	language: "auto",
	darkMode: false,
	newGPA: true,
	bx: false,
	reportHidden: [],
	scheduleHeight: 65,
	lastBroadcast: 0,
	emailName: "",
	emailUnseen: 0,
	waterId: "",
	waterBrand: "6",
	appSecretLockMinutes: 0,
	verifyPasswordBeforeEnterApp: false,
	verifyPasswordBeforeEnterReport: false,
	verifyPasswordBeforeEnterFinance: false,
	verifyPasswordBeforeEnterPhysicalExam: false,
	useBiometrics: false,
	appLocked: false,
	exitTimestamp: 0,
	subFunctionUnlocked: false,
	homeFunctionDisabled: [],
};
