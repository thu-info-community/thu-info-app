import {ActionType, createAction, createAsyncAction} from "typesafe-actions";
import {
	CHANGE_PASSWORD,
	DO_LOGOUT,
	LOGIN_FAILURE,
	LOGIN_REQUEST,
	LOGIN_SUCCESS,
} from "../constants";
import {Auth, LoginStatus} from "../states/auth";

export const loginAction = createAsyncAction(
	LOGIN_REQUEST,
	LOGIN_SUCCESS,
	LOGIN_FAILURE,
)<Auth, undefined, LoginStatus>();
export const changePasswordAction = createAction(CHANGE_PASSWORD)<string>();
export const doLogoutAction = createAction(DO_LOGOUT)();

const authAction = {loginAction, changePasswordAction, doLogoutAction};
export type AuthAction = ActionType<typeof authAction>;
