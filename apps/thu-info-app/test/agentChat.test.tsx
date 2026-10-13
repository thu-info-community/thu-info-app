import React from "react";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react-native";
import {Alert, Linking} from "react-native";
import {AgentDeepSeekScreen} from "../src/ui/home/agentDeepseek";
import {
	AgentMessageTurn,
	AgentWelcome,
	agentChatStyles,
} from "../src/components/home/agentChat";
import {
	agentProgressText,
	groupAgentMessages,
	turnContent,
} from "../src/components/home/agentChatPresentation";
import type {AgentCheckpoint, Message} from "../src/agent/types";
import {colorLight} from "../src/assets/colors/light";
import {agentService} from "../src/agent/service";

let mockLanguage: "zh" | "en" = "zh";
let mockCampusModelName = "DeepSeek-V4.1-Flash";

jest.mock("../src/utils/i18n", () => ({
	get langCode() {
		return mockLanguage;
	},
	getStr: (key: string) =>
		(mockLanguage === "zh"
			? require("../src/assets/translations/zh").default
			: require("../src/assets/translations/en").default)[key] ?? key,
}));
jest.mock("../src/utils/campusModel", () => ({
	get campusModelName() {
		return mockCampusModelName;
	},
}));
jest.mock("../src/assets/themes/themes", () => ({
	__esModule: true,
	default: () => ({colors: require("../src/assets/colors/light").colorLight}),
}));
jest.mock("react-native-markdown-display", () => ({
	__esModule: true,
	default: (props: any) =>
		require("react").createElement(
			require("react-native").Text,
			{...props, testID: "answer-markdown"},
			props.children,
		),
}));
jest.mock("@react-navigation/native", () => ({
	useFocusEffect: (callback: () => void) => {
		require("react").useEffect(callback, [callback]);
	},
}));
jest.mock("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({top: 24, bottom: 20, left: 0, right: 0}),
}));
jest.mock("../src/agent/nativeTools", () => ({
	openAgentHandoff: jest.fn(),
	sessionNeedsUnlock: () => false,
}));
jest.mock("../src/redux/store", () => ({
	navigationRef: {navigate: jest.fn()},
	helper: {
		getNewsChannelList: jest.fn(async () => [
			{id: "campus", title: "校园新闻"},
		]),
	},
}));
jest.mock("react-redux", () => ({
	useSelector: (selector: (state: unknown) => unknown) => selector(mockState),
}));
jest.mock("../src/agent/service", () => ({
	agentService: {
		open: jest.fn(),
		forAccount: () => ({usage: async () => 0, list: async () => []}),
	},
}));

const mockState = {
	auth: {userId: "student"},
	config: {
		appLocked: false,
		bubbleMessage: true,
		agentThinking: "default",
	},
};
const message = (id: string, content: string, reasoning?: string): Message => ({
	id,
	role: "assistant",
	content,
	reasoning,
});
const checkpoint = (): AgentCheckpoint => ({
	version: 1,
	runId: "run",
	status: "idle",
	messages: [],
	activeTools: [],
	catalogPaths: [],
	protectedTools: [],
	summary: "",
	request: "",
	steps: 0,
	compactions: 0,
	updatedAt: 0,
	protocolCreatedAt: Date.now(),
	thinking: "default",
	approvals: [],
	operations: [],
});
const runtime = () => ({
	session: {
		header: {id: "conversation", account: "student"},
		messages: [] as Message[],
		checkpoint: checkpoint(),
	},
	subscribe: () => () => {},
	getRevision: () => 0,
	isRunning: () => false,
	send: jest.fn(async () => {}),
	stop: jest.fn(async () => {}),
	answer: jest.fn(async () => {}),
	respond: jest.fn(async () => {}),
	resume: jest.fn(async () => {}),
	regenerate: jest.fn(async () => {}),
});
const route = {params: undefined} as any;
beforeEach(() => {
	jest.clearAllMocks();
	mockLanguage = "zh";
	mockCampusModelName = "DeepSeek-V4.1-Flash";
	mockState.auth.userId = "student";
	mockState.config.appLocked = false;
});
afterEach(async () => {
	await cleanup();
	jest.restoreAllMocks();
});

test("groups consecutive model steps without changing stored messages or losing intermediate prose", () => {
	const messages: Message[] = [
		{id: "user", role: "user", content: "Question"},
		message("one", "Looking up tools", "First thought"),
		message("two", "", "Second thought"),
		message("three", "Final answer", "Final thought"),
	];
	const original = JSON.stringify(messages);
	const turns = groupAgentMessages(messages);
	expect(turns).toHaveLength(2);
	expect(turns[1].id).toBe("one");
	expect(turnContent(turns[1])).toEqual({
		answer: "Final answer",
		steps: [
			{id: "one", text: "First thought\n\nLooking up tools"},
			{id: "two", text: "Second thought"},
			{id: "three", text: "Final thought"},
		],
	});
	expect(JSON.stringify(messages)).toBe(original);
	expect(groupAgentMessages([])).toEqual([]);
});

test("an unfinished step keeps previous prose in the process instead of presenting it as a final answer", () => {
	const [turn] = groupAgentMessages([
		message("one", "I'll look up your grades."),
		message("two", "<think>Still working"),
	]);
	expect(turnContent(turn).answer).toBe("");
	expect(turnContent(turn).steps.map(({text}) => text)).toEqual([
		"I'll look up your grades.",
		"Still working",
	]);
});

test("progress uses actual unresolved tool calls and does not claim success from model prose", () => {
	const cp = checkpoint();
	cp.status = "running";
	cp.messages = [
		{
			role: "assistant",
			content: [
				{type: "text", text: "Payment completed"},
				{
					type: "tool-call",
					toolName: "import_tools",
					toolCallId: "catalog",
					input: {path: ""},
				},
			],
		},
	];
	expect(agentProgressText(cp)).toBe("正在查看可用工具");
	cp.messages.push({
		role: "tool",
		content: [
			{
				type: "tool-result",
				toolName: "import_tools",
				toolCallId: "catalog",
				output: {type: "json", value: []},
			},
		],
	});
	expect(agentProgressText(cp)).toBe("正在思考并整理回答");
	cp.status = "awaiting_approval";
	expect(agentProgressText(cp)).toBe("等待你确认");
});

test.each([true, false])(
	"thought disclosure stays independent with bubble messages %s",
	async (bubbleMessage) => {
		const one = groupAgentMessages([
			message("one", "First answer", "First reasoning"),
		])[0];
		const two = groupAgentMessages([
			message("two", "Second answer", "Second reasoning"),
		])[0];
		await render(
			<>
				<AgentMessageTurn
					turn={one}
					colors={colorLight}
					bubbleMessage={bubbleMessage}
					active={false}
					onDocument={() => {}}
					onError={() => {}}
				/>
				<AgentMessageTurn
					turn={two}
					colors={colorLight}
					bubbleMessage={bubbleMessage}
					active={false}
					onDocument={() => {}}
					onError={() => {}}
				/>
			</>,
		);
		expect(screen.queryByText("First reasoning")).toBeNull();
		await fireEvent.press(screen.getAllByRole("button", {name: "思考过程"})[0]);
		expect(screen.getByText("First reasoning")).toBeTruthy();
		expect(screen.queryByText("Second reasoning")).toBeNull();
	},
);

test("answer links require native confirmation and Markdown images never load", async () => {
	const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
	const open = jest.spyOn(Linking, "openURL").mockResolvedValue();
	const turn = groupAgentMessages([message("answer", "Answer")])[0];
	await render(
		<AgentMessageTurn
			turn={turn}
			colors={colorLight}
			bubbleMessage
			active={false}
			onDocument={() => {}}
			onError={() => {}}
		/>,
	);
	const markdown = screen.getByTestId("answer-markdown");
	expect(markdown.props.rules.image()).toBeNull();
	expect(markdown.props.onLinkPress("https://example.org/source")).toBe(false);
	expect(open).not.toHaveBeenCalled();
	await act(() => alert.mock.calls[0][2]![1].onPress!());
	expect(open).toHaveBeenCalledWith("https://example.org/source");
});

test("suggestions fill a draft without starting a request", async () => {
	const select = jest.fn();
	await render(
		<AgentWelcome colors={colorLight} disabled={false} onSelect={select} />,
	);
	await fireEvent.press(screen.getByRole("button", {name: "看看今天的日程"}));
	expect(select).toHaveBeenCalledWith("帮我看看今天的课表和日程。");
});

test("large text increases line height without narrowing the conversation column", () => {
	expect(agentChatStyles(2).panelBody.lineHeight).toBeGreaterThan(
		agentChatStyles(1).panelBody.lineHeight!,
	);
	expect(agentChatStyles(2).column.maxWidth).toBe(760);
});

test.each([
	{language: "zh", title: "助手", model: "DeepSeek-V4.1-Flash"},
	{language: "zh", title: "助手", model: "qwen3.8-27b"},
	{language: "en", title: "Assistant", model: "DeepSeek-V4.1-Flash"},
	{language: "en", title: "Assistant", model: "qwen3.8-27b"},
] as const)(
	"the $language assistant identity is independent of model $model",
	async ({language, title, model}) => {
		mockLanguage = language;
		mockCampusModelName = model;
		(agentService.open as jest.Mock).mockResolvedValue(runtime());
		await render(<AgentDeepSeekScreen route={route} />);
		expect(screen.getByRole("header", {name: title})).toBeTruthy();
		expect(screen.getByText(model)).toBeTruthy();
		expect(screen.queryByRole("header", {name: "DeepSeek"})).toBeNull();
	},
);

test("the composer sends the user's message with the selected settings", async () => {
	const runner = runtime();
	(agentService.open as jest.Mock).mockResolvedValue(runner);
	await render(<AgentDeepSeekScreen route={route} />);
	await fireEvent.changeText(
		await screen.findByLabelText("消息"),
		"看看我的日程",
	);
	await fireEvent.press(screen.getByRole("button", {name: "发送"}));
	expect(runner.send).toHaveBeenCalledWith("看看我的日程", "default", null);
});

test("a locked conversation remains hidden when the assistant is always enabled", async () => {
	mockState.config.appLocked = true;
	(agentService.open as jest.Mock).mockResolvedValue(runtime());
	await render(<AgentDeepSeekScreen route={route} />);
	expect(await screen.findByRole("button", {name: "解锁"})).toBeTruthy();
	expect(screen.queryByRole("textbox", {name: "消息"})).toBeNull();
});

test("Stop remains accessible while many reasoning steps are collapsed", async () => {
	const runner = runtime();
	runner.isRunning = () => true;
	runner.session.checkpoint.status = "running";
	runner.session.messages = Array.from({length: 60}, (_, index) =>
		message(`step${index}`, "", `Reasoning ${index}`),
	);
	(agentService.open as jest.Mock).mockResolvedValue(runner);
	await render(<AgentDeepSeekScreen route={route} />);
	expect(screen.queryByText("Reasoning 59")).toBeNull();
	await fireEvent.press(await screen.findByRole("button", {name: "停止"}));
	expect(runner.stop).toHaveBeenCalledTimes(1);
});

test("approval shows the full preview and blocks sending until a native decision", async () => {
	const runner = runtime();
	runner.session.checkpoint.status = "awaiting_approval";
	const preview = "完整操作参数 ".repeat(100);
	runner.session.checkpoint.approvals = [
		{
			id: "approval",
			toolCallId: "action",
			tool: "booking",
			version: "1",
			runId: "run",
			account: "student",
			args: {},
			preview,
			fingerprint: "fingerprint",
			createdAt: Date.now(),
			expiresAt: Date.now() + 60000,
		},
	];
	(agentService.open as jest.Mock).mockResolvedValue(runner);
	await render(<AgentDeepSeekScreen route={route} />);
	expect((await screen.findByText(preview.trim())).props.children).toBe(
		preview,
	);
	await fireEvent.changeText(screen.getByLabelText("消息"), "new request");
	await fireEvent.press(screen.getByRole("button", {name: "发送"}));
	expect(runner.send).not.toHaveBeenCalled();
	await fireEvent.press(screen.getByRole("button", {name: "仅批准这一次"}));
	expect(runner.respond).toHaveBeenCalledWith("approval", true);
});

test("signed-out state does not load or reveal a conversation", async () => {
	mockState.auth.userId = "";
	await render(<AgentDeepSeekScreen route={route} />);
	expect(screen.getByRole("button", {name: "登录"})).toBeTruthy();
	expect(agentService.open).not.toHaveBeenCalled();
	expect(screen.queryByRole("textbox", {name: "消息"})).toBeNull();
});
