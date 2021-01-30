import {ActionType, createAsyncAction} from "typesafe-actions";
import {
	DO_LOGOUT,
	LOGIN_FAILURE,
	LOGIN_REQUEST,
	LOGIN_SUCCESS,
} from "../constants";
import {Auth, LoginStatus} from "../states/auth";
import {Dispatch} from "redux";
import {leanCloudInit} from "../../utils/leanCloud";
import {fullNameThunk} from "./basics";
import {refreshCalendarConfig} from "./config";
import CookieManager from "@react-native-community/cookies";
import {helper, store} from "../store";

const authAction = createAsyncAction(
	LOGIN_REQUEST,
	LOGIN_SUCCESS,
	LOGIN_FAILURE,
)<Auth, Auth, LoginStatus>();

export type AuthAction =
	| ActionType<typeof authAction>
	| {type: typeof DO_LOGOUT; payload: undefined};

export const authThunk = (
	userId: string,
	password: string,
	statusIndicator: () => void,
) => (dispatch: Dispatch<AuthAction>) => {
	dispatch(authAction.request({userId, password}));
	helper.dormPassword = store.getState().credentials.dormPassword;
	CookieManager.clearAll()
		.then(() => helper.login(userId, password, statusIndicator))
		.then((r) => {
			// Things that should be done only once upon logged in
			leanCloudInit();
			refreshCalendarConfig();
			dispatch(authAction.success(r));
			// @ts-ignore
			dispatch(fullNameThunk());
		})
		.catch((reason: LoginStatus) => {
			dispatch(authAction.failure(reason));
		});
};

export const doLogout = () => {
	// TODO: safely remove the redux
	helper.logout().then(() => console.log("Successfully logged out."));
	store.dispatch({type: DO_LOGOUT, payload: undefined});
};
