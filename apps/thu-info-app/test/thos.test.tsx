import React from "react";
import {beforeEach, afterEach, expect, jest, test} from "@jest/globals";
import {act, fireEvent, render, screen} from "@testing-library/react-native";
import {
	THOS_BACK_SCRIPT,
	ThosPortalScreen,
	ThosScreen,
} from "../src/ui/home/thos";
import {
	ThosServiceDetailScreen,
	ThosTaskDetailScreen,
} from "../src/ui/home/thosDetail";
import type {
	ThosService,
	ThosTask,
} from "@thu-info/lib/src/models/home/thos-services";
import {helper} from "../src/redux/store";
import {THOS_HOME} from "@thu-info/lib/src/lib/thos-services";
import {USER_AGENT} from "@thu-info/lib/src/constants/strings";
import type {RootNav} from "../src/components/Root";
import AsyncStorage from "@react-native-async-storage/async-storage";

let mockUserId = "synthetic-user";
jest.mock("react-redux", () => ({useSelector: () => mockUserId}));
jest.mock("../src/components/views", () => ({
	RoundedView: require("react-native").View,
}));
jest.mock("../src/redux/store", () => ({
	helper: {
		mocked: jest.fn(),
		prepareThosSession: jest.fn(),
		getThosTasks: jest.fn(),
		getThosServices: jest.fn(),
	},
	currState: () => ({config: {language: "zh"}}),
	navigationRef: {isReady: () => true, navigate: jest.fn()},
}));
jest.mock("../src/assets/themes/themes", () => ({
	__esModule: true,
	default: () => ({colors: {text: "black", mainTheme: "purple"}}),
}));
jest.mock("@thu-info/lib/src/lib/core", () => ({}));
jest.mock("@thu-info/lib/src/utils/network", () => ({}));
jest.mock("@react-native-async-storage/async-storage", () => ({
	__esModule: true,
	default: {
		getItem: jest.fn(async () => null),
		setItem: jest.fn(async () => {}),
	},
}));
const setOptions = jest.fn();
const nav = {navigate: jest.fn(), goBack: jest.fn(), setOptions} as unknown as RootNav;
const portal = () => (
	<ThosPortalScreen route={{params: {url: THOS_HOME}}} navigation={nav} />
);
beforeEach(() => {
	jest.clearAllMocks();
	mockUserId = "synthetic-user";
	jest.mocked(helper.mocked).mockReturnValue(false);
	jest
		.mocked(helper.prepareThosSession)
		.mockResolvedValue({active: 0, todo: 0});
	jest
		.mocked(helper.getThosTasks)
		.mockResolvedValue({items: [], total: 0, complete: true});
	jest
		.mocked(helper.getThosServices)
		.mockResolvedValue({items: [], total: 0, complete: true});
});
afterEach(() => {
	jest.useRealTimers();
});

test("quick and all services share the catalog and favorites remain local", async () => {
	jest.mocked(helper.getThosServices).mockResolvedValue({
		items: [
			{
				id: "synthetic-a",
				name: "测试入校",
				department: "测试部门",
				url: THOS_HOME,
			},
			{
				id: "synthetic-b",
				name: "测试场地",
				department: "测试部门",
				url: THOS_HOME,
			},
		],
		total: 2,
		complete: true,
	});
	await render(<ThosScreen navigation={nav} />);
	expect(screen.getByText("收藏服务 0")).toBeTruthy();
	expect(screen.getByText("测试入校")).toBeTruthy();
	expect(screen.getByText("测试场地")).toBeTruthy();
	await fireEvent.press(screen.getByTestId("thos-favorite-synthetic-a"));
	expect(screen.getByText("收藏服务 1")).toBeTruthy();
	expect(AsyncStorage.setItem).toHaveBeenCalledWith(
		"thos-favorites:synthetic-user",
		"[\"synthetic-a\"]",
	);
	await fireEvent.press(screen.getByText("收藏服务 1"));
	expect(screen.getByText("测试入校")).toBeTruthy();
	expect(screen.queryByText("测试场地")).toBeNull();
	await fireEvent.changeText(screen.getByTestId("thos-search"), "no-match");
	expect(screen.getByText("没有匹配结果")).toBeTruthy();
	await fireEvent.press(screen.getByText("全部服务"));
	expect(screen.getByText("测试场地")).toBeTruthy();
	expect(screen.getByTestId("thos-search").props.value).toBe("");
	expect(helper.getThosServices).toHaveBeenCalledTimes(1);
	expect(nav.navigate).not.toHaveBeenCalled();
});

test("defaults to favorite services when local favorites exist", async () => {
	jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(
		JSON.stringify(["synthetic-a"]),
	);
	jest.mocked(helper.getThosServices).mockResolvedValue({
		items: [
			{
				id: "synthetic-a",
				name: "测试入校",
				department: "测试部门",
				url: THOS_HOME,
			},
			{
				id: "synthetic-b",
				name: "测试场地",
				department: "测试部门",
				url: THOS_HOME,
			},
		],
		total: 2,
		complete: true,
	});
	await render(<ThosScreen navigation={nav} />);
	expect(screen.getByText("收藏服务 1")).toBeTruthy();
	expect(screen.getByText("测试入校")).toBeTruthy();
	expect(screen.queryByText("测试场地")).toBeNull();
});

test("WebView starts only after THUInfo establishes the target session", async () => {
	let finish!: (value: {active: number; todo: number}) => void;
	jest.mocked(helper.prepareThosSession).mockImplementation(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	await render(portal());
	expect(screen.queryByTestId("thos-webview")).toBeNull();
	await act(async () => {
		finish({active: 0, todo: 0});
	});
	const web = screen.getByTestId("thos-webview");
	expect(web.props.source).toEqual({uri: THOS_HOME});
	expect(web.props.userAgent).toBe(USER_AGENT);
	expect(web.props.sharedCookiesEnabled).toBe(true);
	expect(helper.prepareThosSession).toHaveBeenCalledTimes(1);
});
test("portal installs a native handler for the official back button", async () => {
	await render(portal());
	const web = screen.getByTestId("thos-webview");
	expect(web.props.injectedJavaScriptBeforeContentLoaded).toContain(
		THOS_BACK_SCRIPT,
	);
	expect(web.props.injectedJavaScriptBeforeContentLoaded).toContain(
		"#head_back",
	);
});
test("official back button returns to the app when the webview has no history", async () => {
	await render(portal());
	await fireEvent(screen.getByTestId("thos-webview"), "message", {
		nativeEvent: {
			url: THOS_HOME,
			data: JSON.stringify({type: "thos-back"}),
		},
	});
	expect(nav.goBack).toHaveBeenCalledTimes(1);
});
test("auth redirect returns to built-in authentication instead of an embedded login", async () => {
	await render(portal());
	let allowed = true;
	await act(async () => {
		allowed = screen
			.getByTestId("thos-webview")
			.props.onShouldStartLoadWithRequest({
				url: "https://webvpn.tsinghua.edu.cn/login",
			});
	});
	expect(allowed).toBe(false);
	expect(screen.getByTestId("thos-portal-error").props.children).toContain(
		"使用内置认证",
	);
});
test("failed shared authentication does not open the portal", async () => {
	jest
		.mocked(helper.prepareThosSession)
		.mockRejectedValue(new Error("synthetic failure"));
	await render(portal());
	expect(screen.queryByTestId("thos-webview")).toBeNull();
	expect(screen.getByTestId("thos-portal-error")).toBeTruthy();
});
test("logged-out dashboard uses the existing login screen", async () => {
	mockUserId = "";
	await render(<ThosScreen navigation={nav} />);
	expect(screen.getByText("使用 THU Info 账号登录")).toBeTruthy();
	expect(helper.prepareThosSession).not.toHaveBeenCalled();
});
test("request failures stay unknown rather than being presented as empty lists", async () => {
	jest
		.mocked(helper.getThosTasks)
		.mockRejectedValue(new Error("synthetic failure"));
	await render(<ThosScreen navigation={nav} />);
	await fireEvent.press(screen.getByText("待我处理"));
	expect(screen.getByText("读取中")).toBeTruthy();
	expect(screen.getByTestId("thos-error").props.children).toContain(
		"待我处理读取失败",
	);
});
test("late results cannot restore data after account logout", async () => {
	let finish!: (value: {active: number; todo: number}) => void;
	jest.mocked(helper.prepareThosSession).mockImplementation(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	const result = await render(<ThosScreen navigation={nav} />);
	mockUserId = "";
	await result.rerender(<ThosScreen navigation={nav} />);
	await act(async () => {
		finish({active: 9, todo: 8});
	});
	expect(helper.getThosTasks).not.toHaveBeenCalled();
	expect(screen.queryByText("9")).toBeNull();
});

const nativeTask: ThosTask = {
	id: "synthetic-process",
	key: "synthetic-process:work",
	kind: "todo",
	title: "合成测试事务",
	status: "待我处理",
	node: "合成测试节点",
	date: "",
	url: THOS_HOME,
};
const nativeDraft: ThosTask = {
	id: "synthetic-draft",
	key: "synthetic-draft",
	kind: "drafts",
	title: "合成测试草稿",
	status: "草稿",
	node: "",
	date: "2026-09-09 14:05",
	summary: "尚未提交",
	url: THOS_HOME,
};
const nativeUnread: ThosTask = {
	id: "synthetic-unread",
	key: "synthetic-unread:work",
	kind: "unread",
	title: "合成待阅事项",
	status: "未阅",
	workflowStatus: "正在办理",
	node: "当前节点",
	date: "2026-09-09",
	url: THOS_HOME,
};
const nativePhase: ThosTask = {
	id: "synthetic-phase",
	key: "synthetic-phase",
	kind: "phases",
	title: "合成阶段性事项",
	status: "正在办理",
	node: "当前进度 1/2",
	date: "",
	progress: 50,
	phaseSteps: [],
	url: THOS_HOME,
};
const nativeService: ThosService = {
	id: "synthetic-service",
	name: "合成测试服务",
	department: "合成测试部门",
	url: THOS_HOME,
};
const taskDetail = () => (
	<ThosTaskDetailScreen
		route={{params: {task: nativeTask, accountId: "synthetic-user"}}}
		navigation={nav}
	/>
);

test("task and service cards open native details without visiting an official page", async () => {
	jest
		.mocked(helper.getThosTasks)
		.mockImplementation(async (kind) => ({
			items: kind === "todo" ? [nativeTask] : [],
			total: kind === "todo" ? 1 : 0,
			complete: true,
		}));
	jest
		.mocked(helper.getThosServices)
		.mockResolvedValue({items: [nativeService], total: 1, complete: true});
	await render(<ThosScreen navigation={nav} />);
	await fireEvent.press(screen.getByText("待我处理"));
	await fireEvent.press(screen.getByText(nativeTask.title));
	expect(nav.navigate).toHaveBeenLastCalledWith("ThosTaskDetail", {
		task: nativeTask,
		accountId: "synthetic-user",
	});
	await fireEvent.press(screen.getByText("全部服务"));
	await fireEvent.press(screen.getByText(nativeService.name));
	expect(nav.navigate).toHaveBeenLastCalledWith("ThosServiceDetail", {
		service: nativeService,
		accountId: "synthetic-user",
	});
	expect(nav.navigate).toHaveBeenCalledTimes(2);
});

test("draft list uses the same native selection and detail flow", async () => {
	jest.mocked(helper.getThosTasks).mockImplementation(async (kind) => ({
		items: kind === "drafts" ? [nativeDraft] : [],
		total: kind === "drafts" ? 1 : 0,
		complete: true,
	}));
	await render(<ThosScreen navigation={nav} />);
	await fireEvent.press(screen.getByText("草稿 —"));
	expect(screen.getByText(nativeDraft.title)).toBeTruthy();
	await fireEvent.press(screen.getByText(nativeDraft.title));
	expect(nav.navigate).toHaveBeenLastCalledWith("ThosTaskDetail", {
		task: nativeDraft,
		accountId: "synthetic-user",
	});
});

test("unread and phased lists use the same native selection flow", async () => {
	jest.mocked(helper.getThosTasks).mockImplementation(async (kind) => ({
		items:
			kind === "unread"
				? [nativeUnread]
				: kind === "phases"
					? [nativePhase]
					: [],
		total: kind === "unread" || kind === "phases" ? 1 : 0,
		complete: true,
	}));
	await render(<ThosScreen navigation={nav} />);
	await fireEvent.press(screen.getByText("待阅 —"));
	expect(screen.getByText(nativeUnread.title)).toBeTruthy();
	await fireEvent.press(screen.getByText("阶段性事项"));
	expect(screen.getByText(nativePhase.title)).toBeTruthy();
});

test("native task detail shows actual node and unknown progress until explicit website navigation", async () => {
	await render(taskDetail());
	expect(screen.getByTestId("thos-native-detail")).toBeTruthy();
	expect(screen.getByText("合成测试节点")).toBeTruthy();
	expect(screen.queryByText("系统未提供进度百分比")).toBeNull();
	expect(screen.queryByTestId("thos-webview")).toBeNull();
	expect(helper.prepareThosSession).not.toHaveBeenCalled();
	expect(nav.navigate).not.toHaveBeenCalled();
	const headerRight = setOptions.mock.calls[setOptions.mock.calls.length - 1]?.[0]
		.headerRight?.();
	expect(headerRight).toBeTruthy();
	await act(async () => headerRight?.props.onPress());
	expect(nav.navigate).toHaveBeenCalledWith("ThosPortal", {url: THOS_HOME});
});

test("service details do not infer missing type or availability", async () => {
	await render(
		<ThosServiceDetailScreen
			route={{params: {service: nativeService, accountId: "synthetic-user"}}}
			navigation={nav}
		/>,
	);
	expect(screen.getByText(nativeService.department!)).toBeTruthy();
	expect(screen.queryByText("系统未提供")).toBeNull();
	expect(screen.queryByTestId("thos-webview")).toBeNull();
	jest
		.mocked(helper.getThosServices)
		.mockResolvedValue({
			items: [{...nativeService, kind: "group", inOpenPeriod: false}],
			total: 1,
			complete: true,
		});
	await act(async () => {
			await screen.getByTestId("thos-native-detail").props.refreshControl.props.onRefresh();
		});
	expect(screen.getByText("服务集合")).toBeTruthy();
	expect(screen.getByText("不在开放时间内")).toBeTruthy();
	expect(nav.navigate).not.toHaveBeenCalled();
});

test("a moved task retains last known information with an explicit refresh error", async () => {
	await render(taskDetail());
	await act(async () => {
			await screen.getByTestId("thos-native-detail").props.refreshControl.props.onRefresh();
	});
	expect(helper.getThosTasks).toHaveBeenCalledWith("todo");
	expect(screen.getByTestId("thos-detail-error")).toBeTruthy();
	expect(screen.getByText(nativeTask.title)).toBeTruthy();
	expect(screen.queryByText("已办结")).toBeNull();
});

test("account changes hide native details and discard outstanding refresh results", async () => {
	let finish!: (value: Awaited<ReturnType<typeof helper.getThosTasks>>) => void;
	jest.mocked(helper.getThosTasks).mockImplementation(
		() =>
			new Promise((resolve) => {
				finish = resolve;
			}),
	);
	const result = await render(taskDetail());
	// Keep the request pending while switching accounts.
	let refresh!: Promise<void>;
	await act(async () => {
		refresh = screen.getByTestId("thos-native-detail").props.refreshControl.props.onRefresh();
	});
	mockUserId = "another-synthetic-user";
	await result.rerender(taskDetail());
	await act(async () => {
		finish({
			items: [{...nativeTask, title: "迟到的私人数据"}],
			total: 1,
			complete: true,
		});
	});
	await refresh;
	expect(screen.getByTestId("thos-account-changed")).toBeTruthy();
	expect(screen.queryByText(nativeTask.title)).toBeNull();
	expect(screen.queryByText("迟到的私人数据")).toBeNull();
	expect(screen.queryByText("进入在线服务网站")).toBeNull();
});
