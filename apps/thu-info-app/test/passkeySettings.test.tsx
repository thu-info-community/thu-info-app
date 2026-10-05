import {afterEach, beforeEach, expect, jest, test} from "@jest/globals";
import {act, cleanup, fireEvent, render, screen, waitFor, within} from "@testing-library/react-native";
import {Alert, Animated} from "react-native";
import {PasskeySettings} from "../src/components/settings/passkeySettings";
import type {RootNav} from "../src/components/Root";
import {disablePasskey, enablePasskey} from "../src/utils/passkey";
import {getPasskeyRootHint} from "../src/utils/passkeyNative";
import zh from "../src/assets/translations/zh";

const configuredAuth = () => ({
	userId: "2026000000",
	passkeys: {"2026000000": {name: "THU Info APP (Pixel 9)", protectionLevel: "unknown"}} as Record<string, {name: string; protectionLevel: string}>,
});
let mockState = {
	auth: configuredAuth(),
	config: {language: "zh"},
};
jest.mock("react-redux", () => ({useSelector: (selector: (state: typeof mockState) => unknown) => selector(mockState)}));
jest.mock("../src/redux/store", () => ({currState: () => ({config: {language: "zh"}})}));
jest.mock("../src/utils/passkeyNative", () => ({passkeyAvailable: true, getPasskeyRootHint: jest.fn()}));
jest.mock("../src/utils/passkey", () => ({enablePasskey: jest.fn(), disablePasskey: jest.fn()}));
jest.mock("../src/ui/settings/settings", () => ({styles: () => ({})}));
jest.mock("react-native-snackbar", () => ({Snackbar: {show: jest.fn(), LENGTH_LONG: 0}}));
const navigation = {navigate: jest.fn()} as unknown as RootNav;
beforeEach(() => {
	mockState.auth = configuredAuth();
	jest.mocked(getPasskeyRootHint).mockResolvedValue(false);
	// Complete native-driven sheet animations so confirmation callbacks run in Jest.
	jest.spyOn(Animated, "parallel").mockImplementation(() => ({
		start: (callback) => callback?.({finished: true}),
		stop: () => {},
		reset: () => {},
	}) as ReturnType<typeof Animated.parallel>);
});
afterEach(async () => { await cleanup(); jest.restoreAllMocks(); jest.resetAllMocks(); });

const deferRootHint = () => {
	let resolve!: (hint: boolean) => void;
	jest.mocked(getPasskeyRootHint).mockReturnValueOnce(new Promise<boolean>((resolveHint) => { resolve = resolveHint; }));
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
		expect(await screen.findByText("删除后，此设备需要使用学校密码登录。")).toBeTruthy();
		await fireEvent.press(screen.getByText("取消"));
		await waitFor(() => expect(screen.queryByText("删除后，此设备需要使用学校密码登录。")).toBeNull());
		expect(disablePasskey).not.toHaveBeenCalled();
		expect(getPasskeyRootHint).not.toHaveBeenCalled();
		expect(alert).not.toHaveBeenCalled();
	} finally { alert.mockRestore(); }
});

test.each(["enable", "reset"] as const)("%s shows the root hint before allowing setup", async (kind) => {
	if (kind === "enable") mockState.auth.passkeys = {};
	jest.mocked(getPasskeyRootHint).mockResolvedValue(true);
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent.press(kind === "enable" ? screen.getByTestId("passkeySettings") : screen.getByText(zh.passkeyReset));
	expect(await screen.findByText(zh.passkeyRootHint)).toBeTruthy();
	expect(screen.getByText(zh.passkeyEnablePrompt)).toBeTruthy();
	expect(enablePasskey).not.toHaveBeenCalled();
	await fireEvent.press(within(screen.getByTestId("bottom-popup-handle")).getByRole("button", {
		name: kind === "enable" ? zh.passkeyEnable : zh.passkeyReset,
	}));
	await waitFor(() => expect(enablePasskey).toHaveBeenCalledTimes(1));
});

test.each(["enable", "reset"] as const)("canceling a rooted-device %s does not start setup", async (kind) => {
	if (kind === "enable") mockState.auth.passkeys = {};
	jest.mocked(getPasskeyRootHint).mockResolvedValue(true);
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent.press(kind === "enable" ? screen.getByTestId("passkeySettings") : screen.getByText(zh.passkeyReset));
	await screen.findByText(zh.passkeyRootHint);
	await fireEvent.press(screen.getByText(zh.cancel));
	await waitFor(() => expect(screen.queryByText(zh.passkeyRootHint)).toBeNull());
	expect(enablePasskey).not.toHaveBeenCalled();
	expect(disablePasskey).not.toHaveBeenCalled();
});

test("reopening setup checks again and clears the previous root hint", async () => {
	mockState.auth.passkeys = {};
	jest.mocked(getPasskeyRootHint).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	await screen.findByText(zh.passkeyRootHint);
	await fireEvent.press(screen.getByText(zh.cancel));
	await waitFor(() => expect(screen.queryByText(zh.passkeyRootHint)).toBeNull());
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	await screen.findByText(zh.passkeyEnablePrompt);
	expect(screen.queryByText(zh.passkeyRootHint)).toBeNull();
	expect(getPasskeyRootHint).toHaveBeenCalledTimes(2);
	await fireEvent.press(screen.getByText(zh.passkeyEnable));
	await waitFor(() => expect(enablePasskey).toHaveBeenCalledTimes(1));
});

test("a failed root hint check still allows ordinary setup", async () => {
	mockState.auth.passkeys = {};
	jest.mocked(getPasskeyRootHint).mockRejectedValueOnce(new Error("native check unavailable"));
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	await screen.findByText(zh.passkeyEnablePrompt);
	expect(screen.queryByText(zh.passkeyRootHint)).toBeNull();
	await fireEvent.press(screen.getByText(zh.passkeyEnable));
	await waitFor(() => expect(enablePasskey).toHaveBeenCalledTimes(1));
});

test("a pending root check disables repeated setup actions", async () => {
	const resolve = deferRootHint();
	await render(<PasskeySettings navigation={navigation} />);
	await fireEvent.press(screen.getByText(zh.passkeyReset));
	expect(screen.getByTestId("passkeySettings")).toBeDisabled();
	await fireEvent.press(screen.getByText(zh.passkeyReset));
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	expect(getPasskeyRootHint).toHaveBeenCalledTimes(1);
	expect(screen.queryByText(zh.passkeyEnablePrompt)).toBeNull();
	expect(enablePasskey).not.toHaveBeenCalled();
	await act(async () => { resolve(true); });
	expect(await screen.findByText(zh.passkeyRootHint)).toBeTruthy();
});

test("a pending root hint from a previous account cannot change the new account's confirmation", async () => {
	mockState.auth.passkeys = {};
	const resolve = deferRootHint();
	const view = await render(<PasskeySettings navigation={navigation} />);
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	mockState.auth.userId = "2026000001";
	await view.rerender(<PasskeySettings navigation={navigation} />);
	expect(screen.getByTestId("passkeySettings")).toBeEnabled();
	await fireEvent.press(screen.getByTestId("passkeySettings"));
	await screen.findByText(zh.passkeyEnablePrompt);
	await act(async () => { resolve(true); });
	expect(screen.queryByText(zh.passkeyRootHint)).toBeNull();
	expect(getPasskeyRootHint).toHaveBeenCalledTimes(2);
	expect(enablePasskey).not.toHaveBeenCalled();
});

test("a pending root check is ignored after the settings component unmounts", async () => {
	mockState.auth.passkeys = {};
	const resolve = deferRootHint();
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
		await screen.findByText("删除后，此设备需要使用学校密码登录。");
		await fireEvent.press(screen.getByText("删除"));
		expect(await screen.findByText("未能删除，请检查网络后重试。")).toBeTruthy();
		expect(screen.getByText("已设置")).toBeTruthy();
		expect(alert).not.toHaveBeenCalled();
	} finally { alert.mockRestore(); }
});
