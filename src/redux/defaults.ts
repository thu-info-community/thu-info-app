import {AuthState, LoginStatus} from "./states/auth";
import {Schedule} from "./states/schedule";
import {Config} from "./states/config";
import {Credentials} from "./states/credentials";
import {Calendar, SemesterType} from "../utils/calendar";

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
	firstDay: new Calendar("2020-09-14"),
	weekCount: 18,
	semesterType: SemesterType.AUTUMN,
	semesterId: "2020-2021-1",
};

export const defaultCredentials: Credentials = {
	dormPassword: "",
};
