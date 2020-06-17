import {defaultFullNameState} from "../defaults";
import {FullNameAction} from "../actions/basics";
import {FULL_NAME_SUCCESS} from "../constants";

export const fullName = (
	state: string = defaultFullNameState,
	action: FullNameAction,
): string => {
	return action.type === FULL_NAME_SUCCESS ? action.payload : state;
};
