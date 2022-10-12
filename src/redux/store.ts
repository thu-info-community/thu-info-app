import {createStore} from "redux";
import {Auth} from "./states/auth";
import {combineReducers} from "redux";
import {auth} from "./reducers/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {persistStore, persistReducer} from "redux-persist";
import {Schedules} from "./states/schedule";
import {schedule} from "./reducers/schedule";
import {Config} from "./states/config";
import {config} from "./reducers/config";
import {createKeychainStorage} from "redux-persist-keychain-storage";
import createTransform from "redux-persist/es/createTransform";
import {credentials} from "./reducers/credentials";
import {Credentials} from "./states/credentials";
import {InfoHelper} from "thu-info-lib";
import dayjs from "dayjs";
import CookieManager from "@react-native-cookies/cookies";
import {
	Schedule,
	scheduleTimeAdd,
} from "thu-info-lib/dist/models/schedule/schedule";
import {defaultTop5, Top5} from "./states/top5";
import {top5} from "./reducers/top5";
import {reservation} from "./reducers/reservation";
import Snackbar from "react-native-snackbar";
import {defaultReservation, Reservation} from "./states/reservation";
import {AppState} from "react-native";
import {configSet} from "./actions/config";
import {createNavigationContainerRef} from "@react-navigation/native";

export const helper = new InfoHelper();

helper.clearCookieHandler = async () => {
	await CookieManager.clearAll();
};

AppState.addEventListener("change", (state) => {
	if (state === "active") {
		const s = currState();
		const currTime = Date.now();
		const lastTime = s.config.exitTimestamp ?? 0;
		const numMinutes = (currTime - lastTime) / 1000 / 60;
		if (
			s.config.verifyPasswordBeforeEnterApp &&
			numMinutes > (s.config.appSecretLockMinutes ?? 0)
		) {
			store.dispatch(configSet("appLocked", true));
		}
		store.dispatch(configSet("subFunctionUnlocked", false));
	} else {
		store.dispatch(configSet("exitTimestamp", Date.now()));
	}
});

const KeychainStorage = createKeychainStorage();

export interface State {
	auth: Auth;
	schedule: Schedules;
	config: Config;
	credentials: Credentials;
	top5: Top5;
	reservation: Reservation;
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
	top5,
	reservation,
});

const authTransform = createTransform(
	undefined,
	(a: Auth) => {
		helper.userId = a.userId;
		helper.password = a.password;
		return a;
	},
	{
		whitelist: ["auth"],
	},
);

const configTransform = createTransform(
	(c: Config) => ({
		...c,
		firstDay: c.firstDay.format("YYYY-MM-DD"),
		appLocked: c.verifyPasswordBeforeEnterApp,
	}),
	(c) => ({...c, firstDay: dayjs(c.firstDay)}),
	{
		whitelist: ["config"],
	},
);

// 该函数用于计划部分数据库重构后的数据迁移
const migrateSchedule = (old: any): Schedule => {
	const res: Schedule = {
		location: old.location || "[数据迁移错误]",
		name: old.name || "[数据迁移错误]",
		type: old.type,
		activeTime: {base: []},
		delOrHideTime: {base: []},
	};

	old?.activeTime?.forEach((val: any) => {
		scheduleTimeAdd(res.activeTime, {
			dayOfWeek: val.dayOfWeek,
			begin: val.begin,
			end: val.end,
			activeWeeks: [val.week],
		});
	});

	old?.delOrHideDetail?.forEach((val: any) => {
		scheduleTimeAdd(res.delOrHideTime, {
			dayOfWeek: val.dayOfWeek,
			begin: val.begin,
			end: val.end,
			activeWeeks: [val.week],
		});
	});

	return res;
};

const persistConfig = {
	version: 5,
	key: "root",
	storage: AsyncStorage,
	whitelist: [
		"auth",
		"schedule",
		"config",
		"credentials",
		"top5",
		"reservation",
	],
	transforms: [authTransform, configTransform],
	migrate: (state: any) =>
		Promise.resolve(
			state === undefined
				? undefined
				: {
						...state,
						schedule: {
							...state.schedule,
							baseSchedule:
								state.schedule.baseSchedule?.[0]?.activeTime?.base === undefined
									? state.schedule.baseSchedule?.map(migrateSchedule) ?? []
									: state.schedule.baseSchedule,
						},
						top5: state.top5 ?? defaultTop5,
						reservation: state.reservation ?? defaultReservation,
						// eslint-disable-next-line no-mixed-spaces-and-tabs
				  },
		),
};

export const store = createStore(persistReducer(persistConfig, rootReducer));

export const persistor = persistStore(store);

export const currState = () => store.getState() as State;

export const navigationRef = createNavigationContainerRef<{Login: undefined}>();

helper.loginErrorHook = (e) => {
	if (navigationRef.isReady()) {
		navigationRef.navigate("Login");
	}
	setTimeout(
		() =>
			Snackbar.show({
				text: `LoginError: ${e.message}`,
				duration: Snackbar.LENGTH_SHORT,
			}),
		100,
	);
};
