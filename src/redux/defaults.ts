import {AuthState, LoginStatus} from "./states/auth";
import {Schedule} from "./states/schedule";
import {Config} from "./states/config";
import {Credentials} from "./states/credentials";

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
};

export const defaultCredentials: Credentials = {
	dormPassword: "",
};
