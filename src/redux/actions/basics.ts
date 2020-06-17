import {ActionType, createAsyncAction} from "typesafe-actions";
import {
	FULL_NAME_FAILURE,
	FULL_NAME_REQUEST,
	FULL_NAME_SUCCESS,
} from "../constants";
import {Dispatch} from "redux";
import {getFullName} from "../../network/Core";

const fullNameAction = createAsyncAction(
	FULL_NAME_REQUEST,
	FULL_NAME_SUCCESS,
	FULL_NAME_FAILURE,
)<undefined, string, undefined>();

export type FullNameAction = ActionType<typeof fullNameAction>;

export const fullNameThunk = () => (dispatch: Dispatch<FullNameAction>) => {
	dispatch(fullNameAction.request());
	getFullName()
		.then((str) => {
			dispatch(fullNameAction.success(str));
		})
		.catch(() => {
			dispatch(fullNameAction.failure());
		});
};
