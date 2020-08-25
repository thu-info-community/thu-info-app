import {AuthState, LoginStatus} from "./states/auth";
import {Schedule} from "./states/schedule";
import {Config} from "./states/config";
import {Credentials} from "./states/credentials";
import {Calendar} from "../utils/calendar";

export const defaultAuthState: AuthState = {
	userId: "",
	password: "",
	status: LoginStatus.None,
};

export const defaultFullNameState = "";

export const defaultSchedule: Schedule = {
	primary: [],
	secondary: [],
	custom: [],
	exam: [],
	cache: "",
	primaryRefreshing: false,
	secondaryRefreshing: false,
	shortenMap: {},
	hiddenRules: [],
};

export const defaultConfigState: Config = {
	doNotRemind: 0,
	lastSelfVersion: 0,
	firstDay: Calendar.firstDay,
	weekCount: Calendar.weekCount,
	semesterType: Calendar.semesterType,
	semesterId: Calendar.semesterId,
};

export const defaultCredentials: Credentials = {
	dormPassword: "",
};
