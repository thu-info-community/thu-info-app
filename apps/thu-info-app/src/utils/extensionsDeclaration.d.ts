export {};

declare global {
	interface Date {
		format(): string;
	}

	interface String {
		format(...args: any[]): string;
	}
}

import type {Action, Reducer} from "redux";
import type {PersistConfig, PersistState} from "redux-persist";

declare module "redux-persist" {
	export function persistReducer<S, A extends Action = Action, P = S>(
		config: PersistConfig<S>,
		baseReducer: Reducer<S, A, P>,
	): Reducer<S & {_persist: PersistState}, A, P & {_persist?: PersistState}>;
}
