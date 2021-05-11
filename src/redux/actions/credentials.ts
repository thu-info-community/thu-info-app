import {SET_DORM_PASSWORD} from "../constants";
import {ActionType, createAction} from "typesafe-actions";

export const setDormPasswordAction = createAction(SET_DORM_PASSWORD)<string>();

const credentialsAction = {setDormPasswordAction};
export type CredentialsAction = ActionType<typeof credentialsAction>;
