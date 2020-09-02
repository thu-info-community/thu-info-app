import {Config} from "../states/config";
import {defaultConfigState} from "../defaults";
import {ConfigAction} from "../actions/config";
import {
	SET_BX,
	SET_CALENDAR_CONFIG,
	SET_DO_NOT_REMIND,
	SET_GRADUATE,
	SET_LAST_SELF_VERSION,
	SET_NEW_GPA,
} from "../constants";
import {Calendar} from "../../utils/calendar";

export const config = (
	state: Config = defaultConfigState,
	action: ConfigAction,
): Config => {
	switch (action.type) {
		case SET_DO_NOT_REMIND:
			return {...state, doNotRemind: action.payload};
		case SET_LAST_SELF_VERSION:
			return {...state, lastSelfVersion: action.payload};
		case SET_CALENDAR_CONFIG:
			const {firstDay, weekCount, semesterType, semesterId} = action.payload;
			return {
				...state,
				firstDay: new Calendar(firstDay),
				weekCount,
				semesterType,
				semesterId,
			};
		case SET_GRADUATE:
			return {
				...state,
				graduate: action.payload,
			};
		case SET_NEW_GPA:
			return {
				...state,
				newGPA: action.payload,
			};
		case SET_BX:
			return {
				...state,
				bx: action.payload,
			};
		default:
			return state;
	}
};
