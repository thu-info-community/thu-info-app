import {applyMiddleware, createStore} from "redux";
import thunk from "redux-thunk";
import {Auth, AuthState} from "./states/auth";
import {combineReducers} from "redux";
import {fullName} from "./reducers/basics";
import {auth} from "./reducers/auth";
import AsyncStorage from "@react-native-community/async-storage";
import {persistStore, persistReducer} from "redux-persist";
import createFilter from "redux-persist-transform-filter";
import createTransform from "redux-persist/es/createTransform";
import {Schedule} from "./states/schedule";
import {schedule} from "./reducers/schedule";

export interface State {
	auth: AuthState;
	fullName: string;
	schedule: Schedule;
}

const rootReducer = combineReducers({
	auth,
	fullName,
	schedule,
});

const authFilter = createFilter("auth", ["userId", "password", "remember"]);

const authTransform = createTransform(
	(inState: Auth) => {
		return inState.remember ? inState : {...inState, userId: "", password: ""};
	},
	(outState) => outState,
	{whitelist: ["auth"]},
);

const persistConfig = {
	version: 1,
	key: "root",
	storage: AsyncStorage,
	whitelist: ["auth", "schedule"],
	transforms: [authFilter, authTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(persistedReducer, applyMiddleware(thunk));

export const persistor = persistStore(store);
