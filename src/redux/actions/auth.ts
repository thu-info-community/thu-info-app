import {ActionType, createAsyncAction} from "typesafe-actions";
import {
	DO_LOGOUT,
	LOGIN_FAILURE,
	LOGIN_REQUEST,
	LOGIN_SUCCESS,
} from "../constants";
import {Auth, LoginStatus} from "../states/auth";
import {Dispatch} from "redux";
import {getTickets, login, logout} from "../../network/core";
import {leanCloudInit} from "../../utils/leanCloud";
import {fullNameThunk} from "./basics";
import {refreshCalendarConfig} from "./config";
import CookieManager from "@react-native-community/cookies";
import {store} from "../store";

const authAction = createAsyncAction(
	LOGIN_REQUEST,
	LOGIN_SUCCESS,
	LOGIN_FAILURE,
)<Auth, Auth, LoginStatus>();

export type AuthAction =
	| ActionType<typeof authAction>
	| {type: typeof DO_LOGOUT; payload: undefined};

export const authThunk = (userId: string, password: string) => (
	dispatch: Dispatch<AuthAction>,
) => {
	dispatch(authAction.request({userId, password}));
	CookieManager.clearAll()
		.then(() => login(userId, password))
		.then((r) => {
			dispatch(authAction.success(r));
			// Things that should be done only once upon logged in
			getTickets();
			leanCloudInit();
			refreshCalendarConfig();
			// @ts-ignore
			dispatch(fullNameThunk());
		})
		.catch((reason: LoginStatus) => {
			dispatch(authAction.failure(reason));
		});
};

export const doLogout = () => {
	logout().then(() => console.log("Successfully logged out."));
	store.dispatch({type: DO_LOGOUT, payload: undefined});
};
