import type {DeepseekState} from "../slices/deepseek";
import {campusModelName} from "../../utils/campusModel";

/** Upgrade the v3.20.0 Redux history; the seed remains stale until a successful fetch. */
export const migrateDeepseekState = (state: DeepseekState): DeepseekState => ({
	...state,
	modelCache: {models: [campusModelName], fetchedAt: 0},
});
