import {SET_DO_NOT_REMIND, SET_DORM_PASSWORD} from "../constants";

export type ConfigAction =
	| {type: typeof SET_DORM_PASSWORD; payload: string}
	| {type: typeof SET_DO_NOT_REMIND; payload: number};
