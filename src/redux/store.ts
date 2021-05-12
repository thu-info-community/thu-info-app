import {createStore} from "redux";
import {AuthState, LoginStatus} from "./states/auth";
import {combineReducers} from "redux";
import {auth} from "./reducers/auth";
import AsyncStorage from "@react-native-community/async-storage";
import {persistStore, persistReducer} from "redux-persist";
import {createBlacklistFilter} from "redux-persist-transform-filter";
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

const authTransform = createTransform(
	(status) =>
		status === LoginStatus.LoggedIn ? LoginStatus.LoggedIn : LoginStatus.None,
	(status) => status,
	{
		whitelist: ["status"],
	},
);

const authPlugin = createTransform(
	(a: AuthState) => a,
	(a: AuthState) => {
		helper.userId = a.userId;
		helper.password = a.password;
		return a;
	},
	{
		whitelist: ["auth"],
	},
);

const credentialsPlugin = createTransform(
	(c: Credentials) => c,
	(c: Credentials) => {
		helper.dormPassword = c.dormPassword;
		return c;
	},
	{
		whitelist: ["credentials"],
	},
);

const configPlugin = createTransform(
	(c: Config) => c,
	(c: Config) => {
		helper.emailName = c.emailName;
		return c;
	},
	{
		whitelist: ["config"],
	},
);

const rootReducer = combineReducers({
	auth: persistReducer(
		{
			keyPrefix: "com.unidy2002.thuinfo.persist.auth.",
			storage: KeychainStorage,
			key: "auth",
			transforms: [authTransform],
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

const calendarConfigTransform = createTransform(
	(subState: Config) => ({
		...subState,
		firstDay: subState.firstDay.date.format("YYYY-MM-DD"),
	}),
	(state) => ({
		...state,
		firstDay: new Calendar(state.firstDay),
	}),
	{whitelist: ["config"]},
);

const scheduleFilter = createBlacklistFilter("schedule", [
	"primaryRefreshing",
	"secondaryRefreshing",
]);

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

const persistConfig = {
	version: 2,
	key: "root",
	storage: AsyncStorage,
	whitelist: ["auth", "schedule", "config", "cache", "credentials"],
	transforms: [
		calendarConfigTransform,
		scheduleFilter,
		cacheTransform,
		authPlugin,
		credentialsPlugin,
		configPlugin,
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

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(persistedReducer);

export const persistor = persistStore(store);

export const currState = () => store.getState() as State;
