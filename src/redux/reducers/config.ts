import {Config} from "../states/config";
import {defaultConfigState} from "../defaults";
import {ConfigAction} from "../actions/config";
import {
	SET_DO_NOT_REMIND,
	SET_DORM_PASSWORD,
	SET_LAST_SELF_VERSION,
} from "../constants";

export const config = (
	state: Config = defaultConfigState,
	action: ConfigAction,
): Config => {
	switch (action.type) {
		case SET_DORM_PASSWORD:
			return {...state, dormPassword: action.payload};
		case SET_DO_NOT_REMIND:
			return {...state, doNotRemind: action.payload};
		case SET_LAST_SELF_VERSION:
			return {...state, lastSelfVersion: action.payload};
		default:
			return state;
	}
};
