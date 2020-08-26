import {ActionType, createAsyncAction} from "typesafe-actions";
import {LOGIN_FAILURE, LOGIN_REQUEST, LOGIN_SUCCESS} from "../constants";
import {Auth, LoginStatus} from "../states/auth";
import {Dispatch} from "redux";
import {getTickets, login} from "../../network/core";
import {leanCloudInit} from "../../utils/leanCloud";
import {checkUpdate} from "../../utils/checkUpdate";
import {fullNameThunk} from "./basics";
import {refreshCalendarConfig} from "./config";
import CookieManager from "react-native-cookies";

const authAction = createAsyncAction(
	LOGIN_REQUEST,
	LOGIN_SUCCESS,
	LOGIN_FAILURE,
)<Auth, Auth, LoginStatus>();

export type AuthAction = ActionType<typeof authAction>;

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
			checkUpdate();
			leanCloudInit();
			refreshCalendarConfig();
			// @ts-ignore
			dispatch(fullNameThunk());
		})
		.catch((reason: LoginStatus) => {
			dispatch(authAction.failure(reason));
		});
};
