import {AuthState, defaultAuthState, LoginStatus} from "../states/auth";
import {AuthAction} from "../actions/auth";
import {
	CHANGE_PASSWORD,
	DO_LOGOUT,
	LOGIN_FAILURE,
	LOGIN_REQUEST,
	LOGIN_SUCCESS,
} from "../constants";

export const auth = (
	state: AuthState = defaultAuthState,
	action: AuthAction,
): AuthState => {
	switch (action.type) {
		case LOGIN_REQUEST: {
			const payload = action.payload;
			return {
				...state,
				userId: payload.userId,
				password: payload.password,
				status: LoginStatus.LoggingIn,
			};
		}
		case LOGIN_SUCCESS: {
			return {
				...state,
				status: LoginStatus.LoggedIn,
			};
		}
		case LOGIN_FAILURE:
			return {
				...state,
				status: LoginStatus.Failed,
			};
		case CHANGE_PASSWORD:
			return {
				...state,
				password: action.payload,
			};
		case DO_LOGOUT:
			return {
				...state,
				userId: "",
				password: "",
				status: LoginStatus.None,
			};
		default:
			return state;
	}
};
