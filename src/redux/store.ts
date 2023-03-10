import {configureStore} from "@reduxjs/toolkit";
import {combineReducers} from "redux";
import {authReducer, AuthState} from "./slices/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	persistStore,
	persistReducer,
	FLUSH,
	PAUSE,
	PERSIST,
	PURGE,
	REGISTER,
	REHYDRATE,
} from "redux-persist";
import {scheduleReducer, ScheduleState} from "./slices/schedule";
import {createKeychainStorage} from "redux-persist-keychain-storage";
import createTransform from "redux-persist/es/createTransform";
import {credentialsReducer, CredentialsState} from "./slices/credentials";
import {InfoHelper} from "thu-info-lib";
import CookieManager from "@react-native-cookies/cookies";
import {is24HourFormat} from "react-native-device-time-format";
import {
	Schedule,
	scheduleTimeAdd,
} from "thu-info-lib/dist/models/schedule/schedule";
import {defaultTop5, top5Reducer, Top5State} from "./slices/top5";
import {
	defaultReservation,
	reservationReducer,
	ReservationState,
} from "./slices/reservation";
import Snackbar from "react-native-snackbar";
import {AppState, Platform, ToastAndroid} from "react-native";
import {createNavigationContainerRef} from "@react-navigation/native";
import {configSet, configReducer, ConfigState} from "./slices/config";
import {
	defaultTimetable,
	timetableReducer,
	TimetableState,
} from "./slices/timetable";
import {
	announcementReducer,
	AnnouncementState,
	defaultAnnouncement,
} from "./slices/announcement";

export const helper = new InfoHelper();

helper.clearCookieHandler = async () => {
	await CookieManager.clearAll();
};

AppState.addEventListener("change", (state) => {
	if (state === "active") {
		if (!persistor.getState().bootstrapped) {
			return;
		}
		const s = currState();
		const currTime = Date.now();
		const lastTime = s.config.exitTimestamp ?? 0;
		const numMinutes = (currTime - lastTime) / 1000 / 60;
		if (numMinutes > (s.config.appSecretLockMinutes ?? 0)) {
			if (s.config.verifyPasswordBeforeEnterApp) {
				store.dispatch(configSet({key: "appLocked", value: true}));
			}
			store.dispatch(configSet({key: "subFunctionUnlocked", value: false}));
		}
		is24HourFormat().then((result) => {
			store.dispatch(configSet({key: "is24Hour", value: result}));
		});
	} else {
		store.dispatch(configSet({key: "exitTimestamp", value: Date.now()}));
		const s = currState();
		if (
			!s.config.disableBackgroundSecurityWarning &&
			Platform.OS === "android"
		) {
			ToastAndroid.show(
				"THU Info 已切换至后台运行。可在设置→帐号与安全中关闭该提示。",
				ToastAndroid.SHORT,
			);
		}
	}
});

const KeychainStorage = createKeychainStorage();

export interface State {
	auth: AuthState;
	schedule: ScheduleState;
	config: ConfigState;
	credentials: CredentialsState;
	top5: Top5State;
	reservation: ReservationState;
	timetable: TimetableState;
	announcement: AnnouncementState;
}

const rootReducer = combineReducers({
	auth: persistReducer(
		{
			keyPrefix: "com.unidy2002.thuinfo.persist.auth.",
			storage: KeychainStorage,
			key: "auth",
		},
		authReducer,
	),
	schedule: scheduleReducer,
	config: configReducer,
	credentials: persistReducer(
		{
			keyPrefix: "com.unidy2002.thuinfo.persist.credentials.",
			storage: KeychainStorage,
			key: "credentials",
		},
		credentialsReducer,
	),
	top5: top5Reducer,
	reservation: reservationReducer,
	timetable: timetableReducer,
	announcement: announcementReducer,
});

const authTransform = createTransform(
	undefined,
	(a: AuthState) => {
		helper.userId = a.userId;
		helper.password = a.password;
		return a;
	},
	{
		whitelist: ["auth"],
	},
);

const configTransform = createTransform(
	undefined,
	(c: ConfigState) => {
		const outState = {...c};
		const currTime = Date.now();
		const lastTime = c.exitTimestamp ?? 0;
		const numMinutes = (currTime - lastTime) / 1000 / 60;
		if (numMinutes > (c.appSecretLockMinutes ?? 0)) {
			if (c.verifyPasswordBeforeEnterApp) {
				outState.appLocked = true;
			}
			outState.subFunctionUnlocked = false;
		}
		return outState;
	},
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
						timetable: state.timetable ?? defaultTimetable,
						announcement: state.announcement ?? defaultAnnouncement,
						// eslint-disable-next-line no-mixed-spaces-and-tabs
				  },
		),
};

export const store = configureStore({
	reducer: persistReducer(persistConfig, rootReducer),
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}),
});

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
