import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import {ValidReceiptTypes} from "thu-info-lib/dist/lib/sports";
import {HomeFunction} from "../../ui/home/home";
import {CalendarData} from "thu-info-lib/dist/models/schedule/calendar";

export interface ConfigState {
	doNotRemindSemver: string | undefined;
	latestVersion: string | undefined;
	lastSelfVersion: number;
	firstDay: string;
	weekCount: number;
	semesterId: string;
	language: string;
	darkMode: boolean | undefined;
	newGPA: boolean;
	bx: boolean;
	reportHidden: string[];
	scheduleHeight: number;
	scheduleHeightMode: 1 | 2 | 3;
	lastBroadcast: number;
	emailUnseen: number;
	receiptTitle: ValidReceiptTypes | undefined;
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
	beta3Notified: boolean | undefined;
	studentNotified: boolean | undefined;
	disableBackgroundSecurityWarning: boolean | undefined;
	is24Hour: boolean | undefined;
}

const initialState: ConfigState = {
	doNotRemindSemver: "0.0.0",
	latestVersion: "3.0.0",
	lastSelfVersion: 0,
	firstDay: "2023-02-20",
	weekCount: 18,
	semesterId: "2022-2023-2",
	language: "auto",
	darkMode: false,
	newGPA: true,
	bx: false,
	reportHidden: [],
	scheduleHeight: 65,
	scheduleHeightMode: 2,
	lastBroadcast: 0,
	emailUnseen: 0,
	receiptTitle: undefined,
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
	beta3Notified: false,
	studentNotified: false,
	disableBackgroundSecurityWarning: false,
	is24Hour: false,
};

// Reference: https://stackoverflow.com/questions/51691235/typescript-map-union-type-to-another-union-type
type PayloadMap<K> = K extends keyof ConfigState
	? {key: K; value: ConfigState[K]}
	: never;

type GenericSetPayload = PayloadMap<keyof ConfigState>;

export const configSlice = createSlice({
	name: "config",
	initialState,
	reducers: {
		setCalendarConfig: (state, {payload}: PayloadAction<CalendarData>) => {
			state.firstDay = payload.firstDay;
			state.weekCount = payload.weekCount;
			state.semesterId = payload.semesterId;
		},
		setupAppSecret: (state) => {
			state.appSecretLockMinutes = 0;
			state.verifyPasswordBeforeEnterApp = true;
			state.verifyPasswordBeforeEnterReport = false;
			state.verifyPasswordBeforeEnterFinance = false;
			state.verifyPasswordBeforeEnterPhysicalExam = false;
			state.useBiometrics = false;
		},
		clearAppSecret: (state) => {
			state.appSecretLockMinutes = 0;
			state.verifyPasswordBeforeEnterApp = false;
			state.verifyPasswordBeforeEnterReport = false;
			state.verifyPasswordBeforeEnterFinance = false;
			state.verifyPasswordBeforeEnterPhysicalExam = false;
			state.useBiometrics = false;
		},
		configSet: (state, {payload}: PayloadAction<GenericSetPayload>) => {
			const {key, value} = payload;
			if (key in initialState) {
				(state[key] as ConfigState[typeof key]) = value;
			}
		},
	},
});

export const {setCalendarConfig, setupAppSecret, clearAppSecret, configSet} =
	configSlice.actions;

export const configReducer = configSlice.reducer;
