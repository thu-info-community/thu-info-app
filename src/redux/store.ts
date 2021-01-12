import {applyMiddleware, createStore} from "redux";
import thunk from "redux-thunk";
import {AuthState, LoginStatus} from "./states/auth";
import {combineReducers} from "redux";
import {fullName} from "./reducers/basics";
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
import {Calendar} from "../utils/calendar";
import {Cache} from "./states/cache";
import {cache} from "./reducers/cache";
import {Hole} from "./states/hole";
import {hole} from "./reducers/hole";

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
	fullName,
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
	version: 1,
	key: "root",
	storage: AsyncStorage,
	whitelist: ["auth", "schedule", "config", "cache", "hole"],
	transforms: [calendarConfigTransform, scheduleFilter, cacheTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(persistedReducer, applyMiddleware(thunk));

export const persistor = persistStore(store);

export const currState = () => store.getState() as State;

export const mocked = () =>
	store.getState().auth.userId === "8888" &&
	store.getState().auth.password === "8888";
