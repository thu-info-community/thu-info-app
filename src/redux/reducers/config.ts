import {Config} from "../states/config";
import {defaultConfigState} from "../defaults";
import {ConfigAction} from "../actions/config";
import {
	ADD_REPORT_HIDDEN,
	REMOVE_REPORT_HIDDEN,
	SET_BX,
	SET_CALENDAR_CONFIG,
	SET_DO_NOT_REMIND,
	SET_GRADUATE,
	SET_LAST_BROADCAST_ID,
	SET_LAST_SELF_VERSION,
	SET_NEW_GPA,
	SET_REMAINDER_SHIFT,
	SET_SCHEDULE_HEIGHT,
} from "../constants";
import {Calendar} from "../../helper/src/models/schedule/calendar";

export const config = (
	state: Config = defaultConfigState,
	action: ConfigAction,
): Config => {
	switch (action.type) {
		case SET_DO_NOT_REMIND:
			return {...state, doNotRemindSemver: action.payload};
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
		case ADD_REPORT_HIDDEN:
			return (state.reportHidden ?? []).indexOf(action.payload) === -1
				? {
						...state,
						reportHidden: (state.reportHidden ?? []).concat(action.payload),
						// eslint-disable-next-line no-mixed-spaces-and-tabs
				  }
				: state;
		case REMOVE_REPORT_HIDDEN:
			return {
				...state,
				reportHidden: (state.reportHidden ?? []).filter(
					(it) => it !== action.payload,
				),
			};
		case SET_SCHEDULE_HEIGHT:
			return {
				...state,
				scheduleHeight: action.payload,
			};
		case SET_REMAINDER_SHIFT:
			return {
				...state,
				remainderShift: action.payload,
			};
		case SET_LAST_BROADCAST_ID:
			return {
				...state,
				lastBroadcast: action.payload,
			};
		default:
			return state;
	}
};
