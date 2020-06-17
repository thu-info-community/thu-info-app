import {AuthState, LoginStatus} from "../states/auth";
import {AuthAction} from "../actions/auth";
import {LOGIN_FAILURE, LOGIN_REQUEST, LOGIN_SUCCESS} from "../constants";
import {defaultAuthState} from "../defaults";

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
				remember: payload.remember,
				status: LoginStatus.LoggingIn,
			};
		}
		case LOGIN_SUCCESS: {
			const payload = action.payload;
			return {
				...state,
				userId: payload.userId,
				password: payload.password,
				remember: payload.remember,
				status: LoginStatus.LoggedIn,
			};
		}
		case LOGIN_FAILURE:
			return {
				...state,
				status: action.payload,
			};
		default:
			return state;
	}
};
