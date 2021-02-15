import {ActionType, createAsyncAction} from "typesafe-actions";
import {
	DO_LOGOUT,
	LOGIN_FAILURE,
	LOGIN_REQUEST,
	LOGIN_SUCCESS,
} from "../constants";
import {Auth, LoginStatus} from "../states/auth";

const authAction = createAsyncAction(
	LOGIN_REQUEST,
	LOGIN_SUCCESS,
	LOGIN_FAILURE,
)<Auth, undefined, LoginStatus>();

export type AuthAction =
	| ActionType<typeof authAction>
	| {type: typeof DO_LOGOUT; payload: undefined};
