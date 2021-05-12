import {createStore} from "redux";
import {AuthState, LoginStatus} from "./states/auth";
import {combineReducers} from "redux";
import {auth} from "./reducers/auth";
import AsyncStorage from "@react-native-community/async-storage";
import {persistStore, persistReducer} from "redux-persist";
import {defaultSchedule, Schedules} from "./states/schedule";
import {schedule} from "./reducers/schedule";
import {Config} from "./states/config";
import {config} from "./reducers/config";
import {createKeychainStorage} from "redux-persist-keychain-storage";
import createTransform from "redux-persist/es/createTransform";
import {credentials} from "./reducers/credentials";
import {Credentials} from "./states/credentials";
import {Cache} from "./states/cache";
import {cache} from "./reducers/cache";
import {InfoHelper} from "thu-info-lib";
import {Calendar} from "thu-info-lib/dist/models/schedule/calendar";
import CookieManager from "@react-native-community/cookies";
import {AppState} from "react-native";
import {retryWrapperWithMocks} from "thu-info-lib/dist/lib/core";
import {emailInit} from "../utils/email";

export const helper = new InfoHelper();

helper.clearCookieHandler = async () => {
	await CookieManager.clearAll();
};

AppState.addEventListener("change", (state) => {
	if (state === "active") {
		setTimeout(() => {
			retryWrapperWithMocks(
				helper,
				undefined,
				() => Promise.reject(),
				undefined,
			).catch(() => console.log("Re-connection done."));
			emailInit().then(() => console.log("Email re-login done."));
		}, 1000); // Wait for data to be rehydrated
	}
});

const KeychainStorage = createKeychainStorage();

export interface State {
	auth: AuthState;
	schedule: Schedules;
	config: Config;
	credentials: Credentials;
	cache: Cache;
}

const rootReducer = combineReducers({
	auth: persistReducer(
		{
			keyPrefix: "com.unidy2002.thuinfo.persist.auth.",
			storage: KeychainStorage,
			key: "auth",
		},
		auth,
	),
	schedule,
	config,
	credentials: persistReducer(
		{
			keyPrefix: "com.unidy2002.thuinfo.persist.credentials.",
			storage: KeychainStorage,
			key: "credentials",
		},
		credentials,
	),
	cache,
});

const authTransform = createTransform(
	(a: AuthState) => ({
		...a,
		status:
			a.status === LoginStatus.LoggedIn
				? LoginStatus.LoggedIn
				: LoginStatus.None,
	}),
	(a: AuthState) => {
		helper.userId = a.userId;
		helper.password = a.password;
		return a;
	},
	{
		whitelist: ["auth"],
	},
);

const cacheTransform = createTransform(
	(subState: Cache) => ({
		...subState,
		news: subState.news.filter(
			(it) => it.timestamp > new Date().valueOf() - 864000000, // 10 days
		),
	}),
	undefined,
	{
		whitelist: ["cache"],
	},
);

const credentialsTransform = createTransform(
	(c: Credentials) => c,
	(c: Credentials) => {
		helper.dormPassword = c.dormPassword;
		return c;
	},
	{
		whitelist: ["credentials"],
	},
);

const configTransform = createTransform(
	(c: Config) => ({...c, firstDay: c.firstDay.date.format("YYYY-MM-DD")}),
	(c) => {
		helper.emailName = c.emailName;
		return {...c, firstDay: new Calendar(c.firstDay)};
	},
	{
		whitelist: ["config"],
	},
);

const persistConfig = {
	version: 2,
	key: "root",
	storage: AsyncStorage,
	whitelist: ["auth", "schedule", "config", "cache", "credentials"],
	transforms: [
		cacheTransform,
		authTransform,
		credentialsTransform,
		configTransform,
	],
	migrate: (state: any) =>
		Promise.resolve(
			state === undefined
				? undefined
				: {
						...state,
						schedule:
							state.schedule.baseSchedule === undefined
								? defaultSchedule
								: state.schedule,
						// eslint-disable-next-line no-mixed-spaces-and-tabs
				  },
		),
};

export const store = createStore(persistReducer(persistConfig, rootReducer));

export const persistor = persistStore(store);

export const currState = () => store.getState() as State;
