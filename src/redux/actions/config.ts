import {SET_DO_NOT_REMIND, SET_LAST_SELF_VERSION} from "../constants";

export type ConfigAction =
	| {type: typeof SET_DO_NOT_REMIND; payload: number}
	| {type: typeof SET_LAST_SELF_VERSION; payload: number};
