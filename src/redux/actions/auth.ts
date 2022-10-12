import {ActionType, createAction} from "typesafe-actions";
import {DO_LOGIN, DO_LOGOUT} from "../constants";
import {Auth} from "../states/auth";

export const doLoginAction = createAction(DO_LOGIN)<Auth>();
export const doLogoutAction = createAction(DO_LOGOUT)();

const authAction = {doLoginAction, doLogoutAction};
export type AuthAction = ActionType<typeof authAction>;
