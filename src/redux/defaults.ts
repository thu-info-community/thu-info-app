import {AuthState, LoginStatus} from "./states/auth";
import {Schedule} from "./states/schedule";
import {Config} from "./states/config";
import {Credentials} from "./states/credentials";
import {Calendar} from "../utils/calendar";
import {Cache} from "./states/cache";
import {Hole} from "./states/hole";

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
	graduate: false,
	newGPA: true,
	bx: false,
	reportHidden: [],
	scheduleHeight: 65,
	remainderShift: 0,
};

export const defaultCredentials: Credentials = {
	dormPassword: "",
};

export const defaultCache: Cache = {
	news: [],
};

export const defaultHole: Hole = {
	token: "",
};
