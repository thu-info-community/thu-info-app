import {ActionType, createAsyncAction} from "typesafe-actions";
import {LOGIN_FAILURE, LOGIN_REQUEST, LOGIN_SUCCESS} from "../constants";
import {Auth, LoginStatus} from "../states/auth";
import {Dispatch} from "redux";
import {login} from "../../network/core";

const authAction = createAsyncAction(
	LOGIN_REQUEST,
	LOGIN_SUCCESS,
	LOGIN_FAILURE,
)<Auth, Auth, LoginStatus>();

export type AuthAction = ActionType<typeof authAction>;

export const authThunk = (
	userId: string,
	password: string,
	remember: boolean,
) => (dispatch: Dispatch<AuthAction>) => {
	dispatch(authAction.request({userId, password, remember}));
	login(userId, password, remember)
		.then((r) => {
			dispatch(authAction.success(r));
		})
		.catch((reason: LoginStatus) => {
			dispatch(authAction.failure(reason));
		});
};
