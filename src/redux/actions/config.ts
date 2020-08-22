import {
	SET_DO_NOT_REMIND,
	SET_DORM_PASSWORD,
	SET_LAST_SELF_VERSION,
} from "../constants";

export type ConfigAction =
	| {type: typeof SET_DORM_PASSWORD; payload: string}
	| {type: typeof SET_DO_NOT_REMIND; payload: number}
	| {type: typeof SET_LAST_SELF_VERSION; payload: number};
