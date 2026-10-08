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
import {scheduleReducer} from "./slices/schedule";
import {createKeychainStorage} from "redux-persist-keychain-storage";
import createTransform from "redux-persist/es/createTransform";
import {credentialsReducer, CredentialsState} from "./slices/credentials";
import {InfoHelper} from "@thu-info/lib";
import {getLocales, uses24HourClock} from "react-native-localize";
import {restoreScheduleState, serializeScheduleState, decodeScheduleState} from "./scheduleData";
import type {ScheduleState} from "./scheduleData";
import {defaultTop5, top5Reducer, Top5State} from "./slices/top5";
import {
	defaultReservation,
	reservationReducer,
	ReservationState,
} from "./slices/reservation";
import {Snackbar} from "react-native-snackbar";
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
import { LoginError, PasskeyError } from "@thu-info/lib/src/utils/error";
import DeviceInfo from "react-native-device-info";
import { deepseekReducer, DeepseekState, defaultDeepseek } from "./slices/deepseek.ts";
import {getSerializableEntries, isSerializable} from "./serializable";
import {sanitizeAuth, migrateAuthStorage} from "./authPersistence";
import {createPasskeyAuthenticator} from "../utils/passkeyNative";
import {waitForPasskeyInteraction} from "../utils/passkeyInteraction";
import zh from "../assets/translations/zh";
import en from "../assets/translations/en";
import {migrateWasherFavourites} from "./migrations/washerFavourites";

const CookieManager = (() => {
	try {
		const module = require("@react-native-cookies/cookies");
		return module.default ?? module;
	} catch {
		const module = require("@preeternal/react-native-cookie-manager");
		return module.default ?? module;
	}
})();

export const helper = new InfoHelper();

helper.fingerprint = defaultAuth.fingerprint;

helper.clearCookieHandler = async () => {
	await CookieManager.clearAll();
};

let lastNonInactiveAppState = AppState.currentState;
AppState.addEventListener("change", (state) => {
	// iOS system authentication temporarily makes the app inactive. Apply the
	// app-lock timeout when returning from background, not from Face ID / Touch ID.
	if (Platform.OS === "ios" && state === "inactive") return;
	const resumedWithoutBackground = Platform.OS === "ios" && state === "active" && lastNonInactiveAppState === "active";
	lastNonInactiveAppState = state;
	if (resumedWithoutBackground) return;
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
			store.dispatch(configSet({key: "is24Hour", value: uses24HourClock()}));
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
			stateReconciler: (inbound: AuthState, _original: AuthState, reduced: AuthState) => sanitizeAuth({...reduced, ...inbound}),
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
	serializeScheduleState,
	decodeScheduleState,
	{whitelist: ["schedule"]},
);

const persistConfig = {
	version: 10,
	blacklist: ["auth", "credentials"],
	key: "root",
	storage: AsyncStorage,
	transforms: [configTransform, scheduleTransform],
	migrate: (incoming: any) => {
		const state = incoming === undefined ? undefined : {...incoming};
		if (state) { delete state.auth; delete state.credentials; }
		return Promise.resolve(
			state === undefined
				? undefined
				: {
						...state,
						config: {
							...state.config,
							washerFavourites: (state._persist?.version ?? -1) < 7
								? migrateWasherFavourites(state.config.washerFavourites)
								: state.config.washerFavourites,
							scheduleUseClassPeriods: state.config.scheduleUseClassPeriods ?? defaultConfig.scheduleUseClassPeriods,
							firstDay: state.config.firstDay ?? defaultConfig.firstDay,
							weekCount: state.config.weekCount ?? defaultConfig.weekCount,
							semesterId: state.config.semesterId ?? defaultConfig.semesterId,
							uuid: state.config.uuid ?? defaultConfig.uuid,
							// `tabletMode` is gone — the layout is driven by width now.
							// `undefined` drops the flag from the persisted JSON on the
							// next write.
							tabletMode: undefined,
						},
						schedule: state.schedule
							? restoreScheduleState(state.schedule, state.config.firstDay ?? defaultConfig.firstDay,
								state.config.semesterId ?? defaultConfig.semesterId)
							: state.schedule,
						top5: state.top5 ?? defaultTop5,
						reservation: state.reservation ?? defaultReservation,
						campusCard: state.campusCard ?? defaultCampusCard,
						timetable: state.timetable ?? defaultTimetable,
						announcement: state.announcement ?? defaultAnnouncement,
						deepseek: state.deepseek ?? defaultDeepseek,
						 
				  },
		);
	},
};

export const store = configureStore({
	reducer: persistReducer(persistConfig, rootReducer),
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
				isSerializable,
				getEntries: getSerializableEntries,
			},
		}),
});

const persistOptions: NonNullable<Parameters<typeof persistStore>[1]> & {manualPersist: boolean} = {manualPersist: true};
export const persistor = persistStore(store, persistOptions);

helper.passkeyAuthenticator = createPasskeyAuthenticator(() => currState().config.appLocked === true, (keyId) =>
	waitForPasskeyInteraction(keyId, () => ({
		loggedInUserId: currState().auth.userId, selectedUserId: helper.userId,
		keyId: helper.passkeyCredential?.keyId, foreground: AppState.currentState === "active",
		appLocked: currState().config.appLocked === true,
	}), (check) => {
		const unsubscribe = store.subscribe(check);
		const subscription = AppState.addEventListener("change", check);
		return () => { unsubscribe(); subscription.remove(); };
	}));
let previousAuth: AuthState | undefined;
store.subscribe(() => {
	const auth = currState().auth;
	if (auth === previousAuth) return;
	previousAuth = auth;
	helper.userId = auth.userId;
	helper.password = auth.authMethod === "passkey" ? "" : auth.password;
	helper.fingerprint = auth.fingerprint || defaultAuth.fingerprint;
	helper.passkeyCredential = auth.authMethod === "passkey" ? auth.passkeys[auth.userId] : undefined;
	helper.passkeyDevice = {
		browser: "THU Info", os: Platform.OS, deviceType: "mobile",
		deviceModel: DeviceInfo.getModel(), uaString: "THUInfo", deviceId: helper.fingerprint,
	};
});

// Complete the migration before nested and root reducers start reading storage.
export const authStorageReady = migrateAuthStorage(AsyncStorage, KeychainStorage)
	.catch(() => {
		Alert.alert("登录信息", "登录信息未能恢复，请重新登录。");
	})
	.then(() => persistor.persist());

export const currState = () => store.getState() as State;

export const navigationRef = createNavigationContainerRef<{
	Login: undefined;
	TwoFactorAuth: {hasWeChatBool: boolean; phone: string | null; hasTotp: boolean};
	RootTabs: undefined;
	ScheduleTab: undefined;
}>();

helper.loginErrorHook = (e) => {
	if (e instanceof PasskeyError && ["locked", "canceled", "interaction-required"].includes(e.code)) return;
	if (e instanceof PasskeyError && e.code === "verification-unavailable") {
		const language = currState().config.language;
		const strings = language === "zh" || (language !== "en" && getLocales()[0].languageTag.startsWith("zh")) ? zh : en;
		Snackbar.show({text: strings.passkeyVerificationUnavailable, duration: Snackbar.LENGTH_LONG});
		return;
	}
	if (e instanceof LoginError && navigationRef.isReady()) {
		navigationRef.navigate("Login");
	}
	setTimeout(
		() =>
			Snackbar.show({
				text: e.message || "登录未成功，请稍后重试。",
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
