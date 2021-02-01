import {applyMiddleware, createStore} from "redux";
import thunk from "redux-thunk";
import {AuthState, LoginStatus} from "./states/auth";
import {combineReducers} from "redux";
import {auth} from "./reducers/auth";
import AsyncStorage from "@react-native-community/async-storage";
import {persistStore, persistReducer} from "redux-persist";
import {createBlacklistFilter} from "redux-persist-transform-filter";
import {Schedules} from "./states/schedule";
import {schedule} from "./reducers/schedule";
import {Config} from "./states/config";
import {config} from "./reducers/config";
import {createKeychainStorage} from "redux-persist-keychain-storage";
import createTransform from "redux-persist/es/createTransform";
import {credentials} from "./reducers/credentials";
import {Credentials} from "./states/credentials";
import {Cache} from "./states/cache";
import {cache} from "./reducers/cache";
import {Hole} from "./states/hole";
import {hole} from "./reducers/hole";
import {InfoHelper} from "thu-info-lib";
import {Calendar} from "thu-info-lib/lib/models/schedule/calendar";
import {defaultSchedule} from "./defaults";

export const helper = new InfoHelper("", "", "", "");

const KeychainStorage = createKeychainStorage();

export interface State {
	auth: AuthState;
	fullName: string;
	schedule: Schedules;
	config: Config;
	credentials: Credentials;
	cache: Cache;
	hole: Hole;
}

const authTransform = createTransform(() => LoginStatus.None, undefined, {
	whitelist: ["status"],
});

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
	hole,
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
	whitelist: ["auth", "schedule", "config", "cache", "hole"],
	transforms: [calendarConfigTransform, scheduleFilter, cacheTransform],
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

export const store = createStore(persistedReducer, applyMiddleware(thunk));

export const persistor = persistStore(store);

export const currState = () => store.getState() as State;
