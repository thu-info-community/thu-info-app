import {afterEach, beforeEach, expect, jest, test} from "@jest/globals";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react-native";
import {Animated, AppState, Platform} from "react-native";
import type {AppStateStatus} from "react-native";
import type {RootNav} from "../src/components/Root";
import {LoginScreen} from "../src/ui/settings/login";
import {PasskeyUpgradeNotice} from "../src/components/settings/passkeyUpgradeNotice";
import {
	authReducer,
	defaultAuth,
	loginWithPasskey,
} from "../src/redux/slices/auth";
import {sanitizeAuth} from "../src/redux/authPersistence";
import {updateAnnouncements} from "../src/redux/slices/announcement";
import {helper, persistor, store as mockStore} from "../src/redux/store";
import type {Dispatch, UnknownAction} from "redux";
import {enablePasskey} from "../src/utils/passkey";
import * as passkeyNative from "../src/utils/passkeyNative";
import {PasskeyError} from "@thu-info/lib/src/utils/error";
import zh from "../src/assets/translations/zh";

let mockState = {
	auth: {...defaultAuth},
	config: {
		language: "zh",
		studentNotified: true,
		privacy312: true,
		appLocked: false,
		latestVersion: "3.0.0",
	},
};
let mockFocused = true;
jest.mock("react-redux", () => ({
	useSelector: (selector: (state: typeof mockState) => unknown) =>
		selector(mockState),
	useDispatch: () => mockStore.dispatch,
}));
jest.mock("@react-navigation/native", () => ({
	useIsFocused: () => mockFocused,
}));
jest.mock("../src/redux/store", () => ({
	currState: () => mockState ?? {config: {language: "zh"}},
	store: {dispatch: jest.fn()},
	persistor: {flush: jest.fn()},
	helper: {
		login: jest.fn(),
		switchLang: jest.fn(),
		appStartUp: jest.fn(),
		hasAuthentication: jest.fn(),
		getLatestVersion: jest.fn(),
	},
}));
jest.mock("../src/utils/passkeyNative", () => ({
	__esModule: true,
	passkeyAvailable: true,
	getPasskeyCapabilities: jest.fn(),
}));
jest.mock("../src/utils/passkey", () => ({
	enablePasskey: jest.fn(),
	disablePasskey: jest.fn(),
}));
jest.mock("../src/ui/settings/settings", () => ({styles: () => ({})}));
jest.mock("react-native-snackbar", () => ({
	Snackbar: {show: jest.fn(), LENGTH_LONG: 0},
}));

const navigation = {navigate: jest.fn(), pop: jest.fn()} as unknown as RootNav;
const appStateDescriptor = Object.getOwnPropertyDescriptor(
	AppState,
	"currentState",
)!;
const legacy = {userId: "2026000000", password: "synthetic-password"};
const credential = {
	userId: legacy.userId,
	keyId: "local-key",
	credentialId: "local-credential",
	userHandle: "handle",
	rpId: "id.tsinghua.edu.cn",
	publicKeyX: "x",
	publicKeyY: "y",
	protectionLevel: "unknown" as const,
	authenticationMode: "required" as const,
};

beforeEach(() => {
	jest.resetAllMocks();
	mockFocused = true;
	mockState = {
		auth: {...defaultAuth},
		config: {
			language: "zh",
			studentNotified: true,
			privacy312: true,
			appLocked: false,
			latestVersion: "3.0.0",
		},
	};
	jest
		.mocked(mockStore.dispatch as Dispatch<UnknownAction>)
		.mockImplementation((action) => {
			mockState.auth = authReducer(mockState.auth, action);
			return action;
		});
	jest.mocked(helper.login).mockResolvedValue(undefined);
	jest.mocked(persistor.flush).mockResolvedValue(undefined);
	jest.mocked(helper.switchLang).mockResolvedValue(undefined);
	jest.mocked(helper.hasAuthentication).mockReturnValue(true);
	jest.mocked(helper.getLatestVersion).mockResolvedValue({
		versionName: "3.20.0",
		releaseNote: "",
		downloadUrl: "",
	});
	jest.mocked(helper.appStartUp).mockResolvedValue({
		bookingRecords: [],
		sportsReservationRecords: [],
		crTimetable: [],
		balance: 0,
		latestAnnounces: [],
	} as unknown as Awaited<ReturnType<typeof helper.appStartUp>>);
	jest.mocked(passkeyNative.getPasskeyCapabilities).mockResolvedValue({
		rootHint: false,
		verificationAvailability: "available",
	});
	Object.defineProperty(AppState, "currentState", {
		configurable: true,
		writable: true,
		value: "active",
	});
	jest.spyOn(AppState, "addEventListener").mockReturnValue({remove: jest.fn()});
	jest.spyOn(Animated, "parallel").mockImplementation(
		() =>
			({
				start: (callback) => callback?.({finished: true}),
				stop: () => {},
				reset: () => {},
			}) as ReturnType<typeof Animated.parallel>,
	);
});
afterEach(async () => {
	await cleanup();
	jest.restoreAllMocks();
	Object.defineProperty(AppState, "currentState", appStateDescriptor);
});

const passwordLogin = async () => {
	await fireEvent.changeText(screen.getByTestId("loginUserId"), legacy.userId);
	await fireEvent.changeText(
		screen.getByTestId("loginPassword"),
		legacy.password,
	);
	await fireEvent.press(screen.getByTestId("loginButton"));
};

test.each(["ios", "android", "harmony"])(
	"%s password login defaults to Passkey and waits for enrollment before startup",
	async (os) => {
		jest.replaceProperty(Platform, "OS", os as typeof Platform.OS);
		let complete!: () => void;
		jest.mocked(enablePasskey).mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					complete = () => {
						mockStore.dispatch(loginWithPasskey(credential));
						resolve(credential);
					};
				}),
		);
		await render(<LoginScreen navigation={navigation} />);
		const passkeySwitch = screen.getByTestId("enablePasskeyOnLogin");
		expect(passkeySwitch.props.value ?? passkeySwitch.props.on).toBe(true);
		await passwordLogin();
		await waitFor(() => expect(enablePasskey).toHaveBeenCalledTimes(1));
		expect(helper.login).toHaveBeenCalledWith(legacy);
		expect(helper.appStartUp).not.toHaveBeenCalled();
		expect(navigation.pop).not.toHaveBeenCalled();
		await act(async () => complete());
		await waitFor(() => expect(navigation.pop).toHaveBeenCalledTimes(1));
		expect(mockState.auth.password).toBe("");
		expect(mockState.auth.authMethod).toBe("passkey");
	},
);

test("opting out preserves password login and suppresses the upgrade reminder", async () => {
	await render(<LoginScreen navigation={navigation} />);
	await fireEvent(
		screen.getByTestId("enablePasskeyOnLogin"),
		"valueChange",
		false,
	);
	await passwordLogin();
	await waitFor(() => expect(navigation.pop).toHaveBeenCalledTimes(1));
	expect(enablePasskey).not.toHaveBeenCalled();
	expect(mockState.auth.password).toBe(legacy.password);
	expect(sanitizeAuth(mockState.auth).passkeyUpgradePending).toBe(false);
});

test("failed password login does not enroll a Passkey", async () => {
	jest
		.mocked(helper.login)
		.mockRejectedValueOnce(new Error("invalid password"));
	await render(<LoginScreen navigation={navigation} />);
	await passwordLogin();
	await waitFor(() => expect(screen.getByTestId("loginButton")).toBeEnabled());
	expect(enablePasskey).not.toHaveBeenCalled();
	expect(navigation.pop).not.toHaveBeenCalled();
	expect(mockState.auth.userId).toBe("");
});

test("canceling automatic Passkey setup completes login with the password retained", async () => {
	jest
		.mocked(enablePasskey)
		.mockRejectedValueOnce(new PasskeyError("canceled", "Canceled"));
	await render(<LoginScreen navigation={navigation} />);
	await passwordLogin();
	await waitFor(() => expect(navigation.pop).toHaveBeenCalledTimes(1));
	expect(mockState.auth.password).toBe(legacy.password);
	expect(mockState.auth.authMethod).toBe("password");
});

test("password recovery does not reactivate the failing Passkey and allows a later replacement", async () => {
	mockState.auth = authReducer(defaultAuth, loginWithPasskey({...credential, authenticationMode: "silent"}));
	await render(<LoginScreen navigation={navigation} />);
	await fireEvent.changeText(screen.getByTestId("loginPassword"), legacy.password);
	await fireEvent.press(screen.getByTestId("loginButton"));
	await waitFor(() => expect(navigation.pop).toHaveBeenCalledTimes(1));
	expect(helper.login).toHaveBeenCalledWith(legacy);
	expect(mockState.auth.authMethod).toBe("password");
	expect(mockState.auth.password).toBe(legacy.password);
	expect(mockState.auth.passkeys[legacy.userId].authenticationMode).toBe("silent");
	expect(enablePasskey).not.toHaveBeenCalled();
});

test("devices without the native module keep normal password login", async () => {
	jest.replaceProperty(passkeyNative, "passkeyAvailable", false);
	await render(<LoginScreen navigation={navigation} />);
	expect(screen.queryByTestId("enablePasskeyOnLogin")).toBeNull();
	await passwordLogin();
	await waitFor(() => expect(navigation.pop).toHaveBeenCalledTimes(1));
	expect(enablePasskey).not.toHaveBeenCalled();
});

test.each(["ios", "harmony", "android"])(
	"%s login loads announcements independently of app version checks",
	async (platform) => {
		jest.replaceProperty(Platform, "OS", platform as typeof Platform.OS);
		jest.replaceProperty(passkeyNative, "passkeyAvailable", false);
		mockState.config.latestVersion = "9.0.0";
		jest.mocked(helper.getLatestVersion).mockRejectedValue(new Error("Version service unavailable"));
		const announcements = [{
			id: 73, title: "Announcement", content: "", createdAt: 0,
			visibleNotAfter: "3.21.0", visibleExact: "",
		}];
		jest.mocked(helper.appStartUp).mockResolvedValue({
			bookingRecords: [],
			sportsReservationRecords: [],
			crTimetable: [],
			balance: 0,
			latestAnnounces: announcements,
		});

		await render(<LoginScreen navigation={navigation} />);
		expect(screen.queryByText(zh.newVersionAvailableClick) !== null).toBe(platform === "android");
		await passwordLogin();
		await waitFor(() =>
			expect(mockStore.dispatch).toHaveBeenCalledWith(updateAnnouncements(announcements)),
		);
		expect(helper.getLatestVersion).toHaveBeenCalledTimes(platform === "android" ? 1 : 0);
	},
);

test("an upgraded account can skip the reminder and does not see it after rehydration", async () => {
	mockState.auth = sanitizeAuth(legacy);
	const view = await render(<PasskeyUpgradeNotice navigation={navigation} />);
	await screen.findByText(zh.passkeyUpgradePrompt);
	expect(persistor.flush).toHaveBeenCalled();
	await fireEvent.press(screen.getByText(zh.cancel));
	await waitFor(() =>
		expect(screen.queryByText(zh.passkeyUpgradePrompt)).toBeNull(),
	);
	await view.unmount();
	mockState.auth = sanitizeAuth(mockState.auth);
	await render(<PasskeyUpgradeNotice navigation={navigation} />);
	expect(screen.queryByText(zh.passkeyUpgradePrompt)).toBeNull();
	expect(enablePasskey).not.toHaveBeenCalled();
});

test("the upgrade reminder can directly enable Passkey", async () => {
	mockState.auth = sanitizeAuth(legacy);
	await render(<PasskeyUpgradeNotice navigation={navigation} />);
	await screen.findByText(zh.passkeyUpgradePrompt);
	await fireEvent.press(
		within(screen.getByTestId("bottom-popup-handle")).getByRole("button", {
			name: zh.passkeyEnable,
		}),
	);
	await waitFor(() => expect(enablePasskey).toHaveBeenCalledTimes(1));
	expect(mockState.auth.passkeyUpgradePending).toBe(false);
});

test("the reminder waits for the home screen to be focused and unlocked", async () => {
	mockState.auth = sanitizeAuth(legacy);
	mockFocused = false;
	const view = await render(<PasskeyUpgradeNotice navigation={navigation} />);
	expect(mockState.auth.passkeyUpgradePending).toBe(true);
	mockFocused = true;
	mockState.config.appLocked = true;
	await view.rerender(<PasskeyUpgradeNotice navigation={navigation} />);
	expect(mockState.auth.passkeyUpgradePending).toBe(true);
	mockState.config.appLocked = false;
	await view.rerender(<PasskeyUpgradeNotice navigation={navigation} />);
	await screen.findByText(zh.passkeyUpgradePrompt);
	expect(mockState.auth.passkeyUpgradePending).toBe(false);
});

test("an existing Passkey does not get an upgrade reminder", async () => {
	mockState.auth = sanitizeAuth({
		...legacy,
		passkeys: {[credential.userId]: credential},
	});
	await render(<PasskeyUpgradeNotice navigation={navigation} />);
	expect(screen.queryByText(zh.passkeyUpgradePrompt)).toBeNull();
	expect(passkeyNative.getPasskeyCapabilities).not.toHaveBeenCalled();
});

test("the reminder waits until the app returns to the foreground", async () => {
	mockState.auth = sanitizeAuth(legacy);
	Object.defineProperty(AppState, "currentState", {
		configurable: true,
		writable: true,
		value: "background",
	});
	let onChange!: (state: AppStateStatus) => void;
	jest
		.spyOn(AppState, "addEventListener")
		.mockImplementation((_type, listener) => {
			onChange = listener;
			return {remove: jest.fn()};
		});
	await render(<PasskeyUpgradeNotice navigation={navigation} />);
	expect(mockState.auth.passkeyUpgradePending).toBe(true);
	expect(screen.queryByText(zh.passkeyUpgradePrompt)).toBeNull();
	await act(async () => onChange("active"));
	await screen.findByText(zh.passkeyUpgradePrompt);
});
