import {configureStore} from "@reduxjs/toolkit";
import {combineReducers} from "redux";
import {authReducer, AuthState, defaultAuth} from "./slices/auth";
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
import {InfoHelper} from "@thu-info/lib";
import CookieManager from "@react-native-cookies/cookies";
import {is24HourFormat} from "react-native-device-time-format";
import {
	Schedule,
	scheduleTimeAdd,
} from "@thu-info/lib/src/models/schedule/schedule";
import {defaultTop5, top5Reducer, Top5State} from "./slices/top5";
import {
	defaultReservation,
	reservationReducer,
	ReservationState,
} from "./slices/reservation";
import Snackbar from "react-native-snackbar";
import {Alert, AppState, Platform, ToastAndroid} from "react-native";
import {createNavigationContainerRef} from "@react-navigation/native";
import {configSet, configReducer, ConfigState, defaultConfig} from "./slices/config";
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
import {
	campusCardReducer,
	CampusCardState,
	defaultCampusCard,
} from "./slices/campusCard";

export const helper = new InfoHelper();

helper.fingerprint = defaultAuth.fingerprint;

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
				"THU Info 已切换至后台运行。可在设置→账号与安全中关闭该提示。",
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
	campusCard: CampusCardState;
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
	campusCard: campusCardReducer,
	timetable: timetableReducer,
	announcement: announcementReducer,
});

const authTransform = createTransform(
	(a: AuthState) => {
		const out = {...a};
		if (!out.fingerprint) {
			out.fingerprint = defaultAuth.fingerprint;
		}
		return out;
	},
	(a: AuthState) => {
		helper.userId = a.userId;
		helper.password = a.password;
		if (!a.fingerprint) {
			a.fingerprint = defaultAuth.fingerprint;
		}
		helper.fingerprint = a.fingerprint;
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
		hash: old.hash || "[数据迁移错误]",
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
						config: {
							...state.config,
							firstDay: state.config.firstDay ?? defaultConfig.firstDay,
							weekCount: state.config.weekCount ?? defaultConfig.weekCount,
							semesterId: state.config.semesterId ?? defaultConfig.semesterId,
						},
						schedule: {
							...state.schedule,
							baseSchedule:
								state.schedule.baseSchedule?.[0]?.activeTime?.base === undefined
									? state.schedule.baseSchedule?.map(migrateSchedule) ?? []
									: state.schedule.baseSchedule,
						},
						top5: state.top5 ?? defaultTop5,
						reservation: state.reservation ?? defaultReservation,
						campusCard: state.campusCard ?? defaultCampusCard,
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

export const navigationRef = createNavigationContainerRef<{
	Login: undefined;
	TwoFactorAuth: {hasWeChatBool: boolean; phone: string | null; hasTotp: boolean};
}>();

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

export const futures = {
	twoFactorMethodFuture: undefined as
		| ((value: "wechat" | "mobile" | "totp" | undefined) => void)
		| undefined,
	twoFactorAuthFuture: undefined as
		| ((value: string | undefined) => void)
		| undefined,
};

helper.twoFactorMethodHook = (hasWeChatBool: boolean, phone: string | null, hasTotp: boolean) => {
	return new Promise<"wechat" | "mobile" | "totp" | undefined>((resolve) => {
		futures.twoFactorMethodFuture = resolve;
		if (navigationRef.isReady()) {
			navigationRef.navigate("TwoFactorAuth", {
				hasWeChatBool,
				phone,
				hasTotp,
			});
		}
	});
};

helper.twoFactorAuthHook = () => {
	return new Promise<string | undefined>((resolve) => {
		futures.twoFactorAuthFuture = resolve;
	});
};

helper.trustFingerprintHook = () => {
	return new Promise<boolean>((resolve) => {
		Alert.alert(
			"二次认证（2FA）",
			"是否将本设备标记为信任设备？\n" +
				"Do you want to mark this device as a trusted device?",
			[
				{text: "No", style: "cancel", onPress: () => resolve(false)},
				{
					text: "Yes",
					onPress: () => resolve(true),
				},
			],
			{cancelable: false},
		);
	});
};
