import {afterEach, beforeEach, expect, jest, test} from "@jest/globals";
import {act, cleanup, fireEvent, render, screen, waitFor, within} from "@testing-library/react-native";
import {Alert, Animated} from "react-native";
import {PasskeySettings} from "../src/components/settings/passkeySettings";
import type {RootNav} from "../src/components/Root";
import {disablePasskey, enablePasskey} from "../src/utils/passkey";
import {getPasskeyCapabilities} from "../src/utils/passkeyNative";
import type {PasskeyCapabilities} from "../src/utils/passkeyNative";
import {PasskeyError} from "@thu-info/lib/src/utils/error";
import {persistor, store} from "../src/redux/store";
import zh from "../src/assets/translations/zh";

const configuredAuth = () => ({
	userId: "2026000000",
	passkeys: {"2026000000": {name: "THU Info APP (Pixel 9)", protectionLevel: "unknown", authenticationMode: "silent"}} as Record<string, {name: string; protectionLevel: string; authenticationMode: "required" | "silent"}>,
	silentPasskeyLogin: {} as Record<string, boolean>,
});
let mockState = {
	auth: configuredAuth(),
	config: {language: "zh"},
};
jest.mock("react-redux", () => ({useSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState)}));
jest.mock("../src/redux/store", () => ({currState: () => mockState ?? {config: {language: "zh"}}, store: {dispatch: jest.fn()}, persistor: {flush: jest.fn()}}));
jest.mock("../src/utils/passkeyNative", () => ({passkeyAvailable: true, getPasskeyCapabilities: jest.fn()}));
jest.mock("../src/utils/passkey", () => ({enablePasskey: jest.fn(), disablePasskey: jest.fn()}));
jest.mock("../src/ui/settings/settings", () => ({styles: () => ({})}));
jest.mock("react-native-snackbar", () => ({Snackbar: {show: jest.fn(), LENGTH_LONG: 0}}));
const navigation = {navigate: jest.fn()} as unknown as RootNav;
const capabilities: PasskeyCapabilities = {rootHint: false, verificationAvailability: "available"};
beforeEach(() => {
	mockState.auth = configuredAuth();
	jest.mocked(getPasskeyCapabilities).mockResolvedValue(capabilities);
	// Complete native-driven sheet animations so confirmation callbacks run in Jest.
	jest.spyOn(Animated, "parallel").mockImplementation(() => ({
		start: (callback) => callback?.({finished: true}),
		stop: () => {},
		reset: () => {},
	}) as ReturnType<typeof Animated.parallel>);
});
afterEach(async () => { await cleanup(); jest.restoreAllMocks(); jest.resetAllMocks(); });

const deferCapabilities = () => {
	let resolve!: (hint: boolean) => void;
	jest.mocked(getPasskeyCapabilities).mockReturnValueOnce(new Promise<PasskeyCapabilities>((resolveCapabilities) => {
		resolve = (rootHint) => resolveCapabilities({...capabilities, rootHint});
	}));
	return resolve;
};

test("uses a device name and plain unknown text for an unconfirmed protection level", async () => {
	await render(<PasskeySettings navigation={navigation} />);
	expect(screen.getByText("THU Info APP (Pixel 9)")).toBeTruthy();
	expect(screen.getByText("未知")).toBeTruthy();
	expect(screen.getByText("已设置")).toBeTruthy();
});

test("the logged-out entry routes to login without starting enrollment", async () => {
	mockState.auth.userId = "";
	try {
		await render(<PasskeySettings navigation={navigation} />);
		expect(screen.getByText("已设置")).toBeTruthy();
		await fireEvent.press(screen.getByTestId("passkeySettings"));
		expect(navigation.navigate).toHaveBeenCalledWith("Login");
	} finally { mockState.auth.userId = "2026000000"; }
});

test("canceling the app confirmation leaves the Passkey intact", async () => {
	const alert = jest.spyOn(Alert, "alert");
	try {
		await render(<PasskeySettings navigation={navigation} />);
		await fireEvent.press(screen.getByTestId("passkeySettings"));
		expect(await screen.findByText(zh.passkeyRemovePrompt)).toBeTruthy();
		await fireEvent.press(screen.getByText("取消"));
		await waitFor(() => expect(screen.queryByText(zh.passkeyRemovePrompt)).toBeNull());
		expect(disablePasskey).not.toHaveBeenCalled();
		expect(getPasskeyCapabilities).not.toHaveBeenCalled();
		expect(alert).not.toHaveBeenCalled();
	} finally { alert.mockRestore(); }
});

test("enabling shows the root hint before allowing setup", async () => {
	mockState.auth.passkeys = {};
	jest.mocked(getPasskeyCapabilities).mockResolvedValue({...capabilities, rootHint: true});
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	expect(await screen.findByText(zh.passkeyRootHint)).toBeTruthy();
	expect(screen.getByText(zh.passkeyEnablePrompt)).toBeTruthy();
	expect(getPasskeyCapabilities).toHaveBeenCalledTimes(1);
	expect(enablePasskey).not.toHaveBeenCalled();
	await fireEvent.press(within(screen.getByTestId("bottom-popup-handle")).getByRole("button", {
		name: zh.passkeyEnable,
	}));
	await waitFor(() => expect(enablePasskey).toHaveBeenCalledTimes(1));
});

test("canceling a rooted-device confirmation does not start setup", async () => {
	mockState.auth.passkeys = {};
	jest.mocked(getPasskeyCapabilities).mockResolvedValue({...capabilities, rootHint: true});
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	await screen.findByText(zh.passkeyRootHint);
	await fireEvent.press(screen.getByText(zh.cancel));
	await waitFor(() => expect(screen.queryByText(zh.passkeyRootHint)).toBeNull());
	expect(enablePasskey).not.toHaveBeenCalled();
	expect(disablePasskey).not.toHaveBeenCalled();
});

test("reopening setup checks again and clears the previous root hint", async () => {
	mockState.auth.passkeys = {};
	jest.mocked(getPasskeyCapabilities).mockResolvedValueOnce({...capabilities, rootHint: true}).mockResolvedValueOnce(capabilities);
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	await screen.findByText(zh.passkeyRootHint);
	await fireEvent.press(screen.getByText(zh.cancel));
	await waitFor(() => expect(screen.queryByText(zh.passkeyRootHint)).toBeNull());
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	await screen.findByText(zh.passkeyEnablePrompt);
	expect(screen.queryByText(zh.passkeyRootHint)).toBeNull();
	expect(getPasskeyCapabilities).toHaveBeenCalledTimes(2);
	await fireEvent.press(screen.getByText(zh.passkeyEnable));
	await waitFor(() => expect(enablePasskey).toHaveBeenCalledTimes(1));
});

test("unknown capabilities still allow ordinary setup", async () => {
	mockState.auth.passkeys = {};
	jest.mocked(getPasskeyCapabilities).mockResolvedValueOnce({rootHint: false, verificationAvailability: "unknown"});
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	await screen.findByText(zh.passkeyEnablePrompt);
	expect(screen.queryByText(zh.passkeyRootHint)).toBeNull();
	await fireEvent.press(screen.getByText(zh.passkeyEnable));
	await waitFor(() => expect(enablePasskey).toHaveBeenCalledTimes(1));
});

test("a pending root check disables repeated setup actions", async () => {
	mockState.auth.passkeys = {};
	const resolve = deferCapabilities();
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	expect(screen.getByTestId("passkeySettings")).toBeDisabled();
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	expect(getPasskeyCapabilities).toHaveBeenCalledTimes(1);
	expect(screen.queryByText(zh.passkeyEnablePrompt)).toBeNull();
	expect(enablePasskey).not.toHaveBeenCalled();
	await act(async () => { resolve(true); });
	expect(await screen.findByText(zh.passkeyRootHint)).toBeTruthy();
});

test("a pending root hint from a previous account cannot change the new account's confirmation", async () => {
	mockState.auth.passkeys = {};
	const resolve = deferCapabilities();
	const view = await render(<PasskeySettings navigation={navigation} />);
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	mockState.auth.userId = "2026000001";
	await view.rerender(<PasskeySettings navigation={navigation} />);
	expect(screen.getByTestId("passkeySettings")).toBeEnabled();
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	await screen.findByText(zh.passkeyEnablePrompt);
	await act(async () => { resolve(true); });
	expect(screen.queryByText(zh.passkeyRootHint)).toBeNull();
	expect(getPasskeyCapabilities).toHaveBeenCalledTimes(2);
	expect(enablePasskey).not.toHaveBeenCalled();
});

test("a pending root check is ignored after the settings component unmounts", async () => {
	mockState.auth.passkeys = {};
	const resolve = deferCapabilities();
	const view = await render(<PasskeySettings navigation={navigation} />);
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	await view.unmount();
	await render(<PasskeySettings navigation={navigation} />);
	await act(async () => { resolve(true); });
	expect(screen.queryByText(zh.passkeyRootHint)).toBeNull();
	expect(screen.queryByText(zh.passkeyEnablePrompt)).toBeNull();
	expect(enablePasskey).not.toHaveBeenCalled();
});

test("a deletion failure appears inside the app and keeps the configured state", async () => {
	const alert = jest.spyOn(Alert, "alert");
	jest.mocked(disablePasskey).mockRejectedValueOnce(new Error("offline"));
	try {
		await render(<PasskeySettings navigation={navigation} />);
		await fireEvent.press(screen.getByTestId("passkeySettings"));
		await screen.findByText(zh.passkeyRemovePrompt);
		await fireEvent.press(screen.getByText("删除"));
		expect(await screen.findByText("未能删除，请检查网络后重试。")).toBeTruthy();
		expect(screen.getByText("已设置")).toBeTruthy();
		expect(alert).not.toHaveBeenCalled();
	} finally { alert.mockRestore(); }
});

test("new credentials default to verified mode while explicitly silent credentials stay silent", async () => {
	const view = await render(<PasskeySettings navigation={navigation} />);
	expect(screen.getByTestId("passkeySilentLogin").props.value).toBe(true);
	mockState.auth.passkeys = {};
	await view.rerender(<PasskeySettings navigation={navigation} />);
	expect(screen.getByTestId("passkeySilentLogin").props.value).toBe(false);
});
test("enabling silent login needs an app warning and leaves the old mode on cancellation", async () => {
	mockState.auth.passkeys["2026000000"].authenticationMode = "required";
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent(screen.getByTestId("passkeySilentLogin"), "valueChange", true);
	expect(await screen.findByText(zh.passkeySilentWarning)).toBeTruthy();
	expect(screen.getByText(zh.passkeyModeChangePrompt)).toBeTruthy();
	await fireEvent.press(screen.getByText(zh.cancel));
	expect(enablePasskey).not.toHaveBeenCalled();
	expect(screen.getByTestId("passkeySilentLogin").props.value).toBe(false);
});
test("confirming silent login rotates the enrolled key with the explicit policy", async () => {
	mockState.auth.passkeys["2026000000"].authenticationMode = "required";
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent(screen.getByTestId("passkeySilentLogin"), "valueChange", true);
	await screen.findByText(zh.passkeySilentWarning);
	await fireEvent.press(screen.getByText(zh.passkeyEnable));
	await waitFor(() => expect(enablePasskey).toHaveBeenCalledWith("silent"));
	expect(screen.getByTestId("passkeySilentLogin").props.value).toBe(false);
});
test("an unenrolled account can select silent mode after the warning", async () => {
	mockState.auth.passkeys = {};
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent(screen.getByTestId("passkeySilentLogin"), "valueChange", true);
	await screen.findByText(zh.passkeySilentWarning);
	await fireEvent.press(screen.getByText(zh.passkeyEnable));
	await waitFor(() => expect(store.dispatch).toHaveBeenCalledWith(expect.objectContaining({payload: {userId: "2026000000", enabled: true}})));
	expect(persistor.flush).toHaveBeenCalled();
	expect(enablePasskey).not.toHaveBeenCalled();
});
test("switching an existing silent key off requires verified replacement", async () => {
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent(screen.getByTestId("passkeySilentLogin"), "valueChange", false);
	await screen.findByText(zh.passkeyVerifiedPrompt);
	await fireEvent.press(within(screen.getByTestId("bottom-popup-handle")).getByRole("button", {name: zh.confirm}));
	await waitFor(() => expect(enablePasskey).toHaveBeenCalledWith("required"));
});
test.each(["not-configured", "unsupported"] as const)("%s devices get guidance without silently weakening the key", async (availability) => {
	jest.mocked(getPasskeyCapabilities).mockResolvedValue({...capabilities, verificationAvailability: availability});
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent(screen.getByTestId("passkeySilentLogin"), "valueChange", false);
	expect(await screen.findByText(zh.passkeyVerificationUnavailable)).toBeTruthy();
	expect(enablePasskey).not.toHaveBeenCalled();
	expect(store.dispatch).not.toHaveBeenCalled();
	expect(screen.getByTestId("passkeySilentLogin").props.value).toBe(true);
});
test("canceling OS verification does not become a setup failure", async () => {
	jest.mocked(enablePasskey).mockRejectedValueOnce(new PasskeyError("canceled", "登录已取消。"));
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent(screen.getByTestId("passkeySilentLogin"), "valueChange", false);
	await screen.findByText(zh.passkeyVerifiedPrompt);
	await fireEvent.press(within(screen.getByTestId("bottom-popup-handle")).getByRole("button", {name: zh.confirm}));
	await waitFor(() => expect(enablePasskey).toHaveBeenCalledTimes(1));
	expect(screen.queryByText(zh.passkeySetupFailed)).toBeNull();
	expect(screen.getByTestId("passkeySilentLogin").props.value).toBe(true);
});
