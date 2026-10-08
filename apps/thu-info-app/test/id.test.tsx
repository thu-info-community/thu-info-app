import React from "react";
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
import {Alert, Animated, Linking} from "react-native";
import type {
	IdAccountInfo,
	IdAuthDevice,
	IdLoginLogPage,
} from "@thu-info/lib/src/models/id/account";
import type {RootNav} from "../src/components/Root";
import type {PasskeyCredential} from "@thu-info/lib";
import {AccountScreen} from "../src/ui/settings/account";
import {LoginScreen} from "../src/ui/settings/login";
import {SettingsScreen} from "../src/ui/settings/settings";
import {IdPersonalInfoScreen} from "../src/ui/settings/idPersonalInfo";
import {IdLoginLogsScreen} from "../src/ui/settings/idLoginLogs";
import {helper} from "../src/redux/store";

let mockState = {
	auth: {userId: "2026000000", password: "synthetic-password", passkeys: {} as Record<string, PasskeyCredential>},
	credentials: {appSecret: undefined},
	config: {language: "zh", darkMode: false, privacy312: true},
};
const mockDispatch = jest.fn();
jest.mock("react-redux", () => ({
	useSelector: (selector: (state: typeof mockState) => unknown) =>
		selector(mockState),
	useDispatch: () => mockDispatch,
}));
jest.mock("../src/redux/store", () => ({
	currState: () => ({config: {language: "zh", darkMode: false}}),
	helper: {
		userId: "2026000000",
		getIdAccountInfo: jest.fn(),
		getIdAuthDevices: jest.fn(),
		getIdLoginLogs: jest.fn(),
		login: jest.fn(),
		logout: jest.fn(),
		mocked: () => false,
	},
}));
jest.mock("../src/utils/easterEgg", () => ({enableEasterEgg: () => false}));
jest.mock("react-native-snackbar", () => ({Snackbar: {show: jest.fn(), LENGTH_SHORT: 0}}));

const navigation = {navigate: jest.fn(), pop: jest.fn()} as unknown as RootNav;
const account: IdAccountInfo = {
	userId: "2026000000",
	username: "demo",
	fullName: "张三",
	emailName: "demo",
	deptString: "计算机系",
	phone: "",
	lastPasswordChangedAt: null,
};
const device: IdAuthDevice = {
	id: "test-device",
	name: "Demo browser",
	createdAt: "2026-01-01 10:00:00",
	updatedAt: "2026-01-02 10:00:00",
};
const log = (appName: string): IdLoginLogPage["items"][number] => ({
	loginTime: "2026-01-02 10:00:00",
	ipAddress: "192.0.2.1",
	appName,
	targetAppName: null,
	isSingleSignOn: false,
});
const deferred = <T,>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return {promise, resolve};
};
const nextPage = () =>
	fireEvent(screen.getByTestId("idLoginLogsList"), "onEndReached");
const refresh = async (testID: string) => {
	await act(async () => {
		screen.getByTestId(testID).props.refreshControl.props.onRefresh();
	});
};

beforeEach(() => {
	jest.resetAllMocks();
	mockState.auth.userId = account.userId;
	mockState.auth.password = "synthetic-password";
	mockState.auth.passkeys = {};
	jest.mocked(helper.getIdAccountInfo).mockResolvedValue({...account});
	jest.mocked(helper.getIdAuthDevices).mockResolvedValue([{...device}]);
	jest.mocked(helper.logout).mockResolvedValue(undefined);
	jest
		.mocked(helper.getIdLoginLogs)
		.mockResolvedValue({items: [log("WebVPN")], total: 1});
});
afterEach(async () => {
	await cleanup();
	jest.restoreAllMocks();
});

test("account screen has independent personal information and log entrances", async () => {
	await render(<AccountScreen navigation={navigation} />);
	await fireEvent.press(screen.getByText("个人信息"));
	await fireEvent.press(screen.getByText("登录日志"));
	expect(navigation.navigate).toHaveBeenNthCalledWith(1, "IdPersonalInfo");
	expect(navigation.navigate).toHaveBeenNthCalledWith(2, "IdLoginLogs");
	expect(helper.getIdAccountInfo).not.toHaveBeenCalled();
});

test("logged-out account entrances route to login", async () => {
	mockState.auth.userId = "";
	await render(<AccountScreen navigation={navigation} />);
	await fireEvent.press(screen.getByText("个人信息"));
	await fireEvent.press(screen.getByText("登录日志"));
	expect(navigation.navigate).toHaveBeenCalledTimes(2);
	expect(navigation.navigate).toHaveBeenCalledWith("Login");
});

test("manage account settings opens a selectable in-app maintenance notice with no system alert or browser action", async () => {
	// The native animation mock never invokes completion callbacks.
	jest.spyOn(Animated, "parallel").mockImplementation(
		() =>
			({
				start: (callback) => callback?.({finished: true}),
				stop: () => {},
				reset: () => {},
			}) as ReturnType<typeof Animated.parallel>,
	);
	const alert = jest.spyOn(Alert, "alert");
	const openURL = jest.spyOn(Linking, "openURL");
	await render(<AccountScreen navigation={navigation} />);
	await fireEvent.press(screen.getByText("管理账号设置"));
	const message = screen.getByText(
		"请使用浏览器访问 https://id.tsinghua.edu.cn/，自行维护账号、密码、手机号和多因子认证设备。",
	);
	expect(message.props.selectable).toBe(true);
	await fireEvent.press(screen.getByText("完成"));
	await waitFor(() =>
		expect(screen.queryByText(message.props.children)).toBeNull(),
	);
	expect(alert).not.toHaveBeenCalled();
	expect(openURL).not.toHaveBeenCalled();
	expect(navigation.navigate).not.toHaveBeenCalled();
});

test("forgot password opens an in-app notice without submitting credentials", async () => {
	const alert = jest.spyOn(Alert, "alert");
	const openURL = jest.spyOn(Linking, "openURL");
	await render(<LoginScreen navigation={navigation} />);
	await fireEvent.press(screen.getByTestId("forgotPasswordButton"));
	expect(
		screen.getByText(
			"如需找回或重置密码，请使用浏览器访问 https://id.tsinghua.edu.cn/ 自行操作。",
		),
	).toBeTruthy();
	expect(helper.login).not.toHaveBeenCalled();
	expect(alert).not.toHaveBeenCalled();
	expect(openURL).not.toHaveBeenCalled();
});

const openLogoutPopup = async () => {
	// Complete native animations synchronously so callbacks cannot outlive the test.
	jest.spyOn(Animated, "parallel").mockImplementation(() => ({
		start: (callback) => callback?.({finished: true}),
		stop: () => {},
		reset: () => {},
	}) as ReturnType<typeof Animated.parallel>);
	await render(<SettingsScreen navigation={navigation} />);
	await fireEvent.press(screen.getByRole("button", {name: "退出登录"}));
};

test("canceling the app logout confirmation leaves the session and cache intact", async () => {
	const alert = jest.spyOn(Alert, "alert");
	await openLogoutPopup();
	await fireEvent.press(screen.getByText("取消"));
	await waitFor(() => expect(screen.queryByText("同时清空缓存")).toBeNull());
	expect(helper.logout).not.toHaveBeenCalled();
	expect(mockDispatch).not.toHaveBeenCalled();
	expect(alert).not.toHaveBeenCalled();
});

test("the app logout confirmation retains cached data by default", async () => {
	await openLogoutPopup();
	expect(screen.getByRole("switch", {name: "同时清空缓存"}).props.value).toBe(false);
	await fireEvent.press(within(screen.getByTestId("bottom-popup-handle")).getByRole("button", {name: "退出登录"}));
	await waitFor(() => expect(helper.logout).toHaveBeenCalledTimes(1));
	expect(mockDispatch.mock.calls.map(([action]) => (action as {type: string}).type)).toEqual(["auth/logout"]);
});

test("the app logout confirmation clears cached data only when selected", async () => {
	await openLogoutPopup();
	await fireEvent(screen.getByRole("switch", {name: "同时清空缓存"}), "valueChange", true);
	await fireEvent.press(within(screen.getByTestId("bottom-popup-handle")).getByRole("button", {name: "退出登录"}));
	await waitFor(() => expect(helper.logout).toHaveBeenCalledTimes(1));
	expect(mockDispatch.mock.calls.map(([action]) => (action as {type: string}).type)).toEqual([
		"auth/logout", "credentials/setDormPassword", "schedule/scheduleClear", "deepseek/deepseekClear",
		"reservation/setActiveLibBookRecord", "reservation/setActiveSportsReservationRecord", "campusCard/setBalance",
	]);
});

const localPasskey = (userId: string): PasskeyCredential => ({
	userId, keyId: "local-key-" + userId, credentialId: "local-credential-" + userId,
	userHandle: "handle", rpId: "tsinghua.edu.cn", publicKeyX: "x", publicKeyY: "y", protectionLevel: "unknown", authenticationMode: "required",
});

test("after logout the sole local Passkey is ready without entering an account or password", async () => {
	const credential = localPasskey(account.userId);
	mockState.auth = {userId: "", password: "", passkeys: {[account.userId]: credential}};
	jest.mocked(helper.login).mockRejectedValueOnce(new Error("Stop after checking the selected method"));
	await render(<LoginScreen navigation={navigation} />);
	expect(screen.getByTestId("loginUserId").props.value).toBe(account.userId);
	expect(screen.getByTestId("loginPassword").props.value).toBe("");
	await fireEvent.press(screen.getByTestId("passkeyLoginButton"));
	await waitFor(() => expect(helper.login).toHaveBeenCalledWith({method: "passkey", credential}));
});

test("multiple local Passkeys let the user directly select the intended account", async () => {
	const first = localPasskey(account.userId);
	const second = localPasskey("2026000001");
	mockState.auth = {userId: "", password: "", passkeys: {[first.userId]: first, [second.userId]: second}};
	jest.mocked(helper.login).mockRejectedValueOnce(new Error("Stop after checking the selected method"));
	await render(<LoginScreen navigation={navigation} />);
	expect(screen.getByTestId("loginUserId").props.value).toBe("");
	await fireEvent.press(screen.getByText("使用 Passkey 登录 · " + second.userId));
	await waitFor(() => expect(helper.login).toHaveBeenCalledWith({method: "passkey", credential: second}));
});

test("a typed recovery password still selects password login for a Passkey account", async () => {
	const credential = localPasskey(account.userId);
	mockState.auth = {userId: "", password: "", passkeys: {[account.userId]: credential}};
	jest.mocked(helper.login).mockRejectedValueOnce(new Error("Stop after checking the selected method"));
	await render(<LoginScreen navigation={navigation} />);
	await fireEvent.changeText(screen.getByTestId("loginPassword"), "transient-test-password");
	await fireEvent.press(screen.getByTestId("loginButton"));
	await waitFor(() => expect(helper.login).toHaveBeenCalledWith({userId: account.userId, password: "transient-test-password"}));
});

test("personal information displays details and explicit missing values", async () => {
	await render(<IdPersonalInfoScreen navigation={navigation} />);
	expect(await screen.findByText("张三")).toBeTruthy();
	expect(await screen.findByText("Demo browser")).toBeTruthy();
	expect(screen.getByText("未绑定")).toBeTruthy();
	expect(screen.getByText("未知")).toBeTruthy();
	expect(screen.getByText(device.createdAt)).toBeTruthy();
	expect(screen.getByText(device.updatedAt)).toBeTruthy();
	expect(helper.getIdAccountInfo).toHaveBeenCalledTimes(1);
	expect(helper.getIdAuthDevices).toHaveBeenCalledTimes(1);
});

test("account failure can be retried and does not prematurely request devices", async () => {
	jest
		.mocked(helper.getIdAccountInfo)
		.mockRejectedValueOnce(new Error("Unavailable"));
	await render(<IdPersonalInfoScreen navigation={navigation} />);
	await screen.findByText("加载失败，请重试");
	expect(helper.getIdAuthDevices).not.toHaveBeenCalled();
	await fireEvent.press(screen.getByText("重试"));
	expect(await screen.findByText("Demo browser")).toBeTruthy();
	expect(helper.getIdAccountInfo).toHaveBeenCalledTimes(2);
});

test("device failure preserves personal information and retries only the device section", async () => {
	jest
		.mocked(helper.getIdAuthDevices)
		.mockRejectedValueOnce(new Error("Unavailable"))
		.mockResolvedValueOnce([]);
	await render(<IdPersonalInfoScreen navigation={navigation} />);
	await screen.findByText("加载失败，请重试");
	expect(screen.getByText("张三")).toBeTruthy();
	await fireEvent.press(screen.getByText("重试"));
	expect(await screen.findByText("暂无信任设备")).toBeTruthy();
	expect(helper.getIdAccountInfo).toHaveBeenCalledTimes(1);
	expect(helper.getIdAuthDevices).toHaveBeenCalledTimes(2);
});

test("personal information discards a response superseded by a refresh", async () => {
	const old = deferred<IdAccountInfo>();
	jest
		.mocked(helper.getIdAccountInfo)
		.mockReturnValueOnce(old.promise)
		.mockResolvedValueOnce({...account, fullName: "李四"});
	await render(<IdPersonalInfoScreen navigation={navigation} />);
	await refresh("idPersonalInfoScroll");
	await screen.findByText("李四");
	await act(async () => old.resolve(account));
	expect(screen.queryByText("张三")).toBeNull();
	expect(helper.getIdAuthDevices).toHaveBeenCalledTimes(1);
});

test("account switching clears personal information and ignores the previous account response", async () => {
	const old = deferred<IdAccountInfo>();
	jest
		.mocked(helper.getIdAccountInfo)
		.mockReturnValueOnce(old.promise)
		.mockResolvedValueOnce({...account, fullName: "李四"});
	const view = await render(<IdPersonalInfoScreen navigation={navigation} />);
	mockState.auth.userId = "2026000001";
	await view.rerender(<IdPersonalInfoScreen navigation={navigation} />);
	await screen.findByText("李四");
	await act(async () => old.resolve(account));
	expect(screen.queryByText("张三")).toBeNull();
});

test("login logs show application routing and SSO state", async () => {
	jest
		.mocked(helper.getIdLoginLogs)
		.mockResolvedValue({
			items: [
				{...log("WebVPN"), targetAppName: "信息门户", isSingleSignOn: true},
			],
			total: 1,
		});
	await render(<IdLoginLogsScreen navigation={navigation} />);
	expect(await screen.findByText("通过“WebVPN”登录“信息门户”")).toBeTruthy();
	expect(screen.getByText("是")).toBeTruthy();
	expect(screen.getByText("192.0.2.1")).toBeTruthy();
	await nextPage();
	expect(helper.getIdLoginLogs).toHaveBeenCalledTimes(1);
});

test("pagination failure retries the same page and preserves previous records", async () => {
	jest
		.mocked(helper.getIdLoginLogs)
		.mockResolvedValueOnce({items: [log("First")], total: 2})
		.mockRejectedValueOnce(new Error("Unavailable"))
		.mockResolvedValueOnce({items: [log("Second")], total: 2});
	await render(<IdLoginLogsScreen navigation={navigation} />);
	await screen.findByText("登录“First”");
	await nextPage();
	await screen.findByText("加载失败，请重试");
	expect(screen.getByText("登录“First”")).toBeTruthy();
	await nextPage();
	expect(helper.getIdLoginLogs).toHaveBeenCalledTimes(2);
	await fireEvent.press(screen.getByText("重试"));
	await screen.findByText("登录“Second”");
	expect(jest.mocked(helper.getIdLoginLogs).mock.calls).toEqual([
		[1],
		[2],
		[2],
	]);
	await nextPage();
	expect(helper.getIdLoginLogs).toHaveBeenCalledTimes(3);
});

test("initial log failure retries the first page", async () => {
	jest
		.mocked(helper.getIdLoginLogs)
		.mockRejectedValueOnce(new Error("Unavailable"));
	await render(<IdLoginLogsScreen navigation={navigation} />);
	await screen.findByText("加载失败，请重试");
	await fireEvent.press(screen.getByText("重试"));
	await screen.findByText("登录“WebVPN”");
	expect(jest.mocked(helper.getIdLoginLogs).mock.calls).toEqual([[1], [1]]);
});

test("refresh supersedes an in-flight next page and restarts at page one", async () => {
	const old = deferred<IdLoginLogPage>();
	jest
		.mocked(helper.getIdLoginLogs)
		.mockResolvedValueOnce({items: [log("First")], total: 2})
		.mockReturnValueOnce(old.promise)
		.mockResolvedValueOnce({items: [log("Fresh")], total: 1});
	await render(<IdLoginLogsScreen navigation={navigation} />);
	await screen.findByText("登录“First”");
	await nextPage();
	await nextPage();
	expect(helper.getIdLoginLogs).toHaveBeenCalledTimes(2);
	await refresh("idLoginLogsList");
	await screen.findByText("登录“Fresh”");
	await act(async () => old.resolve({items: [log("Old")], total: 2}));
	expect(screen.queryByText("登录“Old”")).toBeNull();
	expect(screen.queryByText("登录“First”")).toBeNull();
	expect(jest.mocked(helper.getIdLoginLogs).mock.calls).toEqual([
		[1],
		[2],
		[1],
	]);
});

test("empty login logs do not trigger extra requests", async () => {
	jest.mocked(helper.getIdLoginLogs).mockResolvedValue({items: [], total: 0});
	await render(<IdLoginLogsScreen navigation={navigation} />);
	await screen.findByText("暂无登录日志");
	await nextPage();
	expect(helper.getIdLoginLogs).toHaveBeenCalledTimes(1);
});

test("logout clears login logs and discards pending responses", async () => {
	const old = deferred<IdLoginLogPage>();
	jest.mocked(helper.getIdLoginLogs).mockReturnValueOnce(old.promise);
	const view = await render(<IdLoginLogsScreen navigation={navigation} />);
	mockState.auth.userId = "";
	await view.rerender(<IdLoginLogsScreen navigation={navigation} />);
	expect(screen.getByText("请先登录")).toBeTruthy();
	await act(async () => old.resolve({items: [log("Old")], total: 1}));
	expect(screen.queryByText("登录“Old”")).toBeNull();
	await fireEvent.press(screen.getByText("登录"));
	expect(navigation.navigate).toHaveBeenCalledWith("Login");
});
