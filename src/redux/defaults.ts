import {AuthState, LoginStatus} from "./states/auth";
import {Schedule} from "./states/schedule";

export const defaultAuthState: AuthState = {
	userId: "",
	password: "",
	remember: false,
	status: LoginStatus.None,
};

export const defaultFullNameState = "";

export const defaultSchedule: Schedule = {
	primary: [],
	secondary: [],
	exam: [],
	cache: "",
	primaryRefreshing: false,
	secondaryRefreshing: false,
	shortenMap: {},
};
