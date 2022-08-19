import {Config, defaultConfigState} from "../states/config";
import {ConfigAction} from "../actions/config";
import {
	ADD_REPORT_HIDDEN,
	CLEAR_APP_SECRET,
	REMOVE_REPORT_HIDDEN,
	SET_CALENDAR_CONFIG,
	SETUP_APP_SECRET,
} from "../constants";
import dayjs from "dayjs";

export const config = (
	state: Config = defaultConfigState,
	action: ConfigAction,
): Config => {
	switch (action.type) {
		case SET_CALENDAR_CONFIG:
			const {firstDay, weekCount, semesterId} = action.payload;
			return {
				...state,
				firstDay: dayjs(firstDay),
				weekCount,
				semesterId,
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
		case SETUP_APP_SECRET:
			return {
				...state,
				verifyPasswordBeforeEnterApp: false,
				verifyPasswordBeforeEnterReport: true,
				useBiometrics: false,
			};
		case CLEAR_APP_SECRET:
			return {
				...state,
				verifyPasswordBeforeEnterApp: false,
				verifyPasswordBeforeEnterReport: false,
				useBiometrics: false,
			};
		default: {
			if (defaultConfigState[action.type] !== undefined) {
				const newState = {...state};
				// @ts-ignore
				newState[action.type] = action.payload;
				return newState;
			} else {
				return state;
			}
		}
	}
};
