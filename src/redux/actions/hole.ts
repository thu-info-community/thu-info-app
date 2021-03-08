import {HOLE_SET_BLOCK_WORDS, HOLE_SET_TOKEN} from "../constants";

export type HoleAction =
	| {type: typeof HOLE_SET_TOKEN; payload: string}
	| {type: typeof HOLE_SET_BLOCK_WORDS; payload: string[]};
