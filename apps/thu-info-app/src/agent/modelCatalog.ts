import {currState, store} from "../redux/store";
import {deepseekModelsReceived} from "../redux/slices/deepseek";
import {configSet} from "../redux/slices/config";
import {fetchCampusModels} from "../utils/webApi";
import {campusModelsTTL, selectedCampusModel} from "../utils/campusModel";
import {campusModel} from "./types";

let pending: Promise<string[]> | undefined;

/** Public configuration is shared across accounts; no authorization tokens are cached here. */
export const getCampusModels = async (force = false): Promise<string[]> => {
	const cached = currState().deepseek.modelCache;
	const age = cached ? Date.now() - cached.fetchedAt : Infinity;
	if (
		!force &&
		cached &&
		cached.fetchedAt > 0 &&
		age >= 0 &&
		age < campusModelsTTL
	) {
		return cached.models;
	}
	pending ??= fetchCampusModels()
		.then((models) => {
			store.dispatch(deepseekModelsReceived({models, fetchedAt: Date.now()}));
			return models;
		})
		.finally(() => {
			pending = undefined;
		});
	try {
		return await pending;
	} catch (error) {
		const previous = currState().deepseek.modelCache;
		if (previous) return previous.models;
		throw error;
	}
};

export const resolveCampusModel = async () => {
	const models = await getCampusModels();
	const preferred = currState().config.deepseekModelName;
	const model = selectedCampusModel(models, preferred);
	if (!model)
		throw new Error(
			"No campus models are available. Refresh the model list and retry.",
		);
	if (preferred && preferred !== model) {
		store.dispatch(configSet({key: "deepseekModelName", value: model}));
	}
	return {...campusModel, model};
};
