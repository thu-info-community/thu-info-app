import React from "react";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react-native";
import {Alert} from "react-native";
import {DeepSeekSettingsScreen} from "../src/ui/settings/deepseekSettings";
import {agentService} from "../src/agent/service";

let mockLanguage: "zh" | "en" = "zh";
const mockState = {
	auth: {userId: "student"},
	config: {bubbleMessage: true, darkMode: false},
};
const mockDispatch = jest.fn();
const mockUsage = jest.fn(async (_account: string) => 0);

jest.mock("react-redux", () => ({
	useSelector: (selector: (state: unknown) => unknown) => selector(mockState),
	useDispatch: () => mockDispatch,
}));
jest.mock("../src/redux/store", () => ({
	currState: () => mockState,
}));
jest.mock("../src/utils/easterEgg", () => ({enableEasterEgg: () => false}));
jest.mock("../src/utils/i18n", () => ({
	get langCode() {
		return mockLanguage;
	},
	getStr: (key: string) =>
		(mockLanguage === "zh"
			? require("../src/assets/translations/zh").default
			: require("../src/assets/translations/en").default)[key] ?? key,
}));
jest.mock("../src/agent/service", () => ({
	agentService: {
		forAccount: jest.fn((account: string) => ({
			usage: () => mockUsage(account),
		})),
		clear: jest.fn(async () => {}),
		clearDetails: jest.fn(async () => {}),
	},
}));

const deferred = <T,>() => {
	let resolve!: (value: T) => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<T>((yes, no) => {
		resolve = yes;
		reject = no;
	});
	return {promise, resolve, reject};
};
const confirm = () => {
	const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2];
	const action = buttons?.find((button) => button.style === "destructive");
	if (!action?.onPress)
		throw new Error("No destructive confirmation to accept");
	return action.onPress;
};

beforeEach(() => {
	jest.clearAllMocks();
	mockLanguage = "zh";
	mockState.auth.userId = "student";
	mockState.config = {
		bubbleMessage: true,
		darkMode: false,
	};
	mockUsage.mockReset().mockResolvedValue(0);
	jest.mocked(agentService.clear).mockReset().mockResolvedValue();
	jest.mocked(agentService.clearDetails).mockReset().mockResolvedValue();
	jest.spyOn(Alert, "alert").mockImplementation(() => {});
});
afterEach(async () => {
	await cleanup();
	jest.restoreAllMocks();
});

test.each(["zh", "en"] as const)(
	"message bubbles save immediately in %s",
	async (language) => {
		mockLanguage = language;
		await render(<DeepSeekSettingsScreen />);
		const label = language === "zh" ? "消息气泡" : "Message bubbles";
		await fireEvent(screen.getByLabelText(label), "valueChange", false);
		expect(mockDispatch).toHaveBeenCalledWith({
			type: "config/configSet",
			payload: {key: "bubbleMessage", value: false},
		});
		expect(screen.queryAllByRole("radio")).toHaveLength(0);
		expect(
			screen.queryByText(language === "zh" ? "思考强度" : "Thinking level"),
		).toBeNull();
	},
);

test("storage starts loading and displays zero only after it has been read", async () => {
	const read = deferred<number>();
	mockUsage.mockReturnValue(read.promise);
	await render(<DeepSeekSettingsScreen />);
	expect(screen.getByText("正在读取…")).toBeTruthy();
	expect(screen.queryByText("0.0 MiB")).toBeNull();
	await act(async () => read.resolve(0));
	expect(screen.getByText("0.0 MiB")).toBeTruthy();
	expect(screen.queryByText("正在读取…")).toBeNull();
});

test("a failed storage read can be retried without disabling message preferences", async () => {
	mockUsage.mockRejectedValueOnce(new Error("storage unavailable"));
	await render(<DeepSeekSettingsScreen />);
	expect(screen.getByText("读取失败")).toBeTruthy();
	mockUsage.mockResolvedValue(1536 * 1024);
	await fireEvent.press(screen.getByRole("button", {name: "重新读取"}));
	expect(screen.getByText("1.5 MiB")).toBeTruthy();
	expect(screen.queryByText("读取失败")).toBeNull();
	await fireEvent(screen.getByLabelText("消息气泡"), "valueChange", false);
	expect(mockDispatch).toHaveBeenCalled();
});

test("signed-out storage cannot be cleared, while message preferences remain available", async () => {
	mockState.auth.userId = "";
	await render(<DeepSeekSettingsScreen />);
	expect(agentService.forAccount).not.toHaveBeenCalled();
	expect(screen.getByText("登录后可查看和管理本机对话。")).toBeTruthy();
	for (const label of ["清理详情，保留对话", "删除全部对话"]) {
		const button = screen.getByRole("button", {name: label});
		expect(button).toBeDisabled();
		await fireEvent.press(button);
	}
	expect(Alert.alert).not.toHaveBeenCalled();
	await fireEvent(screen.getByLabelText("消息气泡"), "valueChange", false);
	expect(mockDispatch).toHaveBeenCalled();
});

test("clearing details blocks duplicate clears, preserves history and refreshes usage", async () => {
	const pending = deferred<void>();
	mockUsage
		.mockResolvedValueOnce(8 * 1024 * 1024)
		.mockResolvedValue(1024 * 1024);
	jest.mocked(agentService.clearDetails).mockReturnValue(pending.promise);
	await render(<DeepSeekSettingsScreen />);
	await fireEvent.press(
		screen.getByRole("button", {name: "清理详情，保留对话"}),
	);
	const accept = confirm();
	const [title, message] = jest.mocked(Alert.alert).mock.calls[0];
	expect(title).toBe("确认");
	expect(message).toContain("保留对话文本及操作记录");
	expect(message).toContain("待确认的操作将失效");
	expect(agentService.clearDetails).not.toHaveBeenCalled();
	expect(agentService.clear).not.toHaveBeenCalled();
	let done: unknown;
	await act(async () => {
		done = accept();
	});
	expect(screen.getByText("正在清理详情…")).toBeTruthy();
	expect(screen.getByRole("button", {name: "删除全部对话"})).toBeDisabled();
	await act(async () => accept());
	expect(agentService.clearDetails).toHaveBeenCalledTimes(1);
	await act(async () => {
		pending.resolve();
		await done;
	});
	expect(screen.getByText("1.0 MiB")).toBeTruthy();
	expect(screen.getByRole("button", {name: "删除全部对话"})).toBeEnabled();
	expect(agentService.clear).not.toHaveBeenCalled();
	expect(mockDispatch).not.toHaveBeenCalled();
});

test("deleting all conversations clears legacy history only after successful confirmation", async () => {
	const pending = deferred<void>();
	jest.mocked(agentService.clear).mockReturnValue(pending.promise);
	await render(<DeepSeekSettingsScreen />);
	await fireEvent.press(screen.getByRole("button", {name: "删除全部对话"}));
	expect(jest.mocked(Alert.alert).mock.calls[0][1]).toBe(
		"确定删除所有历史记录吗？",
	);
	expect(agentService.clear).not.toHaveBeenCalled();
	let done: unknown;
	await act(async () => {
		done = confirm()();
	});
	expect(screen.getByText("正在删除对话…")).toBeTruthy();
	expect(mockDispatch).not.toHaveBeenCalled();
	await act(async () => {
		pending.resolve();
		await done;
	});
	expect(agentService.clear).toHaveBeenCalledWith("student");
	expect(mockDispatch).toHaveBeenCalledWith({
		type: "deepseek/deepseekClear",
		payload: undefined,
	});
	expect(mockUsage).toHaveBeenCalledTimes(2);
});

test("failed deletion shows its error, preserves legacy history and allows another attempt", async () => {
	jest
		.mocked(agentService.clear)
		.mockRejectedValueOnce(new Error("disk unavailable"));
	await render(<DeepSeekSettingsScreen />);
	await fireEvent.press(screen.getByRole("button", {name: "删除全部对话"}));
	await act(async () => confirm()());
	expect(Alert.alert).toHaveBeenLastCalledWith(
		"清理失败",
		"Error: disk unavailable",
	);
	expect(mockDispatch).not.toHaveBeenCalled();
	expect(screen.getByRole("button", {name: "删除全部对话"})).toBeEnabled();
});

test.each([50, 100])(
	"storage at %i MiB displays the matching cleanup hint",
	async (mib) => {
		mockUsage.mockResolvedValue(mib * 1024 * 1024);
		await render(<DeepSeekSettingsScreen />);
		expect(screen.getByText(`${mib.toFixed(1)} MiB`)).toBeTruthy();
		expect(screen.getByText(new RegExp(`存储已达 ${mib} MiB`))).toBeTruthy();
	},
);

test("switching accounts ignores a late storage result from the previous account", async () => {
	const previous = deferred<number>();
	mockUsage.mockImplementation(async (account) =>
		account === "student" ? previous.promise : 2 * 1024 * 1024,
	);
	const view = await render(<DeepSeekSettingsScreen />);
	mockState.auth.userId = "another";
	await view.rerender(<DeepSeekSettingsScreen />);
	expect(screen.getByText("2.0 MiB")).toBeTruthy();
	await act(async () => previous.resolve(99 * 1024 * 1024));
	expect(screen.getByText("2.0 MiB")).toBeTruthy();
	expect(screen.queryByText("99.0 MiB")).toBeNull();
});

test("a confirmation opened by the previous account cannot clear the new account", async () => {
	const view = await render(<DeepSeekSettingsScreen />);
	await fireEvent.press(
		screen.getByRole("button", {name: "清理详情，保留对话"}),
	);
	const accept = confirm();
	mockState.auth.userId = "another";
	await view.rerender(<DeepSeekSettingsScreen />);
	await act(async () => accept());
	expect(agentService.clearDetails).not.toHaveBeenCalled();
	expect(agentService.clear).not.toHaveBeenCalled();
});

test("a deletion finishing after an account switch does not clear the new account's Redux history", async () => {
	const pending = deferred<void>();
	jest.mocked(agentService.clear).mockReturnValue(pending.promise);
	const view = await render(<DeepSeekSettingsScreen />);
	await fireEvent.press(screen.getByRole("button", {name: "删除全部对话"}));
	let done: unknown;
	await act(async () => {
		done = confirm()();
	});
	mockState.auth.userId = "another";
	await view.rerender(<DeepSeekSettingsScreen />);
	await act(async () => {
		pending.resolve();
		await done;
	});
	expect(agentService.clear).toHaveBeenCalledWith("student");
	expect(mockDispatch).not.toHaveBeenCalled();
	expect(mockUsage.mock.calls.map(([account]) => account)).toEqual([
		"student",
		"another",
	]);
});

test("an unmounted screen cannot accept an old confirmation", async () => {
	const view = await render(<DeepSeekSettingsScreen />);
	await fireEvent.press(screen.getByRole("button", {name: "删除全部对话"}));
	const accept = confirm();
	await view.unmount();
	await act(async () => accept());
	expect(agentService.clear).not.toHaveBeenCalled();
});
