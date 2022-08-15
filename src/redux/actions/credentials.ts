import {SET_APP_SECRET, SET_DORM_PASSWORD} from "../constants";
import {ActionType, createAction} from "typesafe-actions";

export const setDormPasswordAction = createAction(SET_DORM_PASSWORD)<string>();
export const setAppSecretAction = createAction(SET_APP_SECRET)<
	string | undefined
>();

const credentialsAction = {setDormPasswordAction, setAppSecretAction};
export type CredentialsAction = ActionType<typeof credentialsAction>;
