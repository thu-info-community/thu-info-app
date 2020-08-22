import {AuthState, LoginStatus} from "./states/auth";
import {Schedule} from "./states/schedule";
import {Config} from "./states/config";

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
	dormPassword: "",
	doNotRemind: 0,
	lastSelfVersion: 0,
};
