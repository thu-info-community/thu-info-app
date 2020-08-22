import {SET_DORM_PASSWORD} from "../constants";

export type CredentialsAction = {
	type: typeof SET_DORM_PASSWORD;
	payload: string;
};
