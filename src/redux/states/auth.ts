export enum LoginStatus {
	None,
	LoggingIn,
	LoggedIn,
	Failed,
}

export interface Auth {
	userId: string;
	password: string;
}

export interface AuthState extends Auth {
	status: LoginStatus;
}
