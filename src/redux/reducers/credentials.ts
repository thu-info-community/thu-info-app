import {Credentials} from "../states/credentials";
import {defaultCredentials} from "../defaults";
import {CredentialsAction} from "../actions/credentials";
import {SET_DORM_PASSWORD} from "../constants";
import {helper} from "../store";

export const credentials = (
	state: Credentials = defaultCredentials,
	action: CredentialsAction,
): Credentials => {
	switch (action.type) {
		case SET_DORM_PASSWORD:
			helper.dormPassword = action.payload;
			return {...state, dormPassword: action.payload};
		default:
			return state;
	}
};
