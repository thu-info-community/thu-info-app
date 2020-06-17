import {AuthState, LoginStatus} from "./states/auth";

export const defaultAuthState: AuthState = {
	userId: "",
	password: "",
	remember: false,
	status: LoginStatus.None,
};

export const defaultFullNameState = "";
