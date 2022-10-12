import {Auth, defaultAuth} from "../states/auth";
import {AuthAction} from "../actions/auth";
import {DO_LOGIN, DO_LOGOUT} from "../constants";

export const auth = (state: Auth = defaultAuth, action: AuthAction): Auth => {
	switch (action.type) {
		case DO_LOGIN:
			return action.payload;
		case DO_LOGOUT:
			return defaultAuth;
		default:
			return state;
	}
};
