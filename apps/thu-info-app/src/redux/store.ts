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
	ScheduleTime,
} from "@thu-info/lib/src/models/schedule/schedule";
import dayjs from "dayjs";
import {defaultTop5, top5Reducer, Top5State} from "./slices/top5";
import {
	defaultReservation,
	reservationReducer,
	ReservationState,
} from "./slices/reservation";
import Snackbar from "react-native-snackbar";
import { Alert, AppState, Linking, Platform, ToastAndroid } from "react-native";
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
import { LoginError } from "@thu-info/lib/src/utils/error";
import DeviceInfo from "react-native-device-info";
import { deepseekReducer, DeepseekState, defaultDeepseek } from "./slices/deepseek.ts";

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
		if (Platform.OS === "android" || Platform.OS === "ios") {
			is24HourFormat().then((result) => {
				store.dispatch(configSet({key: "is24Hour", value: result}));
			});
		}
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

const KeychainStorage = Platform.OS === "android" || Platform.OS === "ios" ? createKeychainStorage() : AsyncStorage;

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
	deepseek: DeepseekState;
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
	deepseek: deepseekReducer,
});

const authTransform = createTransform(
	(a: AuthState) => {
		const out = {...a};
		if (!out.fingerprint) {
			out.fingerprint = helper.fingerprint;
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

const scheduleTransform = createTransform(
	(s: ScheduleState) => {
		const transform = (scheduleTime: ScheduleTime) => ({
			base: scheduleTime.base.map((slice) => ({
				dayOfWeek: slice.dayOfWeek,
				beginTime: slice.beginTime.valueOf(),
				endTime: slice.endTime.valueOf(),
			} as never)),
		});
		return {
			...s,
			baseSchedule: s.baseSchedule.map((schedule) => ({
				...schedule,
				activeTime: transform(schedule.activeTime),
				delOrHideTime: transform(schedule.delOrHideTime),
			})),
		};
	},
	(s: ScheduleState) => {
		const transform = (scheduleTime: any) => ({
			base: scheduleTime.base.map((slice: any) => ({
				dayOfWeek: slice.dayOfWeek,
				beginTime: dayjs(slice.beginTime),
				endTime: dayjs(slice.endTime),
			})),
		} as ScheduleTime);
		return {
			...s,
			baseSchedule: s.baseSchedule.map((schedule) => ({
				...schedule,
				activeTime: transform(schedule.activeTime),
				delOrHideTime: transform(schedule.delOrHideTime),
			})),
		};
	},
	{
		whitelist: ["schedule"],
	},
);

// 该函数用于计划部分数据库重构后的数据迁移
const migrateSchedule = (old: Schedule, semesterFirstDay: string): Schedule => {
	const transform = (scheduleTime: any) => ({
		base: scheduleTime.base.flatMap((oldSlice: any) => oldSlice.activeWeeks.map((week: number) => {
			const beginTimes = ["", "08:00", "08:50", "09:50", "10:40", "11:30", "13:30", "14:20", "15:20", "16:10", "17:05", "17:55", "19:20", "20:10", "21:00"];
			const endTimes = ["", "08:45", "09:35", "10:35", "11:25", "12:15", "14:15", "15:05", "16:05", "16:55", "17:50", "18:40", "20:05", "20:55", "21:45"];
			const date = dayjs(semesterFirstDay).add((week - 1) * 7 + oldSlice.dayOfWeek - 1, "day").format("YYYY-MM-DD");
			return {
				dayOfWeek: oldSlice.dayOfWeek,
				beginTime: dayjs(`${date} ${beginTimes[oldSlice.begin]}`),
				endTime: dayjs(`${date} ${endTimes[oldSlice.end]}`),
			};
		})),
	} as ScheduleTime);
	return {
		...old,
		activeTime: transform(old.activeTime),
		delOrHideTime: transform(old.delOrHideTime),
	}
};

const persistConfig = {
	version: 5,
	key: "root",
	storage: AsyncStorage,
	transforms: [authTransform, configTransform, scheduleTransform],
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
							uuid: state.config.uuid ?? defaultConfig.uuid,
						},
						schedule: {
							...state.schedule,
							baseSchedule:
								state.schedule.baseSchedule?.[0]?.activeTime?.base?.[0]?.beginTime === undefined
									? state.schedule.baseSchedule?.map((schedule: Schedule) => migrateSchedule(schedule, state.config.firstDay ?? defaultConfig.firstDay)) ?? []
									: state.schedule.baseSchedule,
						},
						top5: state.top5 ?? defaultTop5,
						reservation: state.reservation ?? defaultReservation,
						campusCard: state.campusCard ?? defaultCampusCard,
						timetable: state.timetable ?? defaultTimetable,
						announcement: state.announcement ?? defaultAnnouncement,
						deepseek: state.deepseek ?? defaultDeepseek,
						 
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
	if (e instanceof LoginError && navigationRef.isReady()) {
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

helper.twoFactorAuthLimitHook = () => {
	return new Promise<void>((resolve) => {
		Alert.alert(
			"二次认证（2FA）",
			"您的二次认证信任设备数量已达到上限，请前往 https://id.tsinghua.edu.cn/ 的 “多因子认证” 管理页面进行管理。\n" +
			"You have reached the limit of trusted devices. Manage your trusted devices in \"Two-factor Authentication\" section.\n",
			[
				{
					text: "Go",
					onPress: () => {
						Linking.openURL("https://id.tsinghua.edu.cn/");
						resolve();
					},
				},
				{
					text: "Cancel",
					style: "cancel",
					onPress: () => {
						resolve();
					},
				},
			],
			{cancelable: false},
		);
	});
};

helper.trustFingerprintHook = () => {
	return new Promise<boolean>((resolve) => {
		Alert.alert(
			"二次认证（2FA）",
			"该设备将被标记为信任设备，以解锁丝滑登录体验。\n" +
				"This device will be marked as a trusted device.",
			[
				{
					text: "确认",
					onPress: () => resolve(true),
				},
			],
			{cancelable: false},
		);
	});
};

helper.trustFingerprintNameHook = async () => {
	return `THU Info APP (${DeviceInfo.getDeviceNameSync()})`;
};
