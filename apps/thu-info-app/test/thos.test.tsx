import React from "react";
import {beforeEach, afterEach, expect, jest, test} from "@jest/globals";
import {act, fireEvent, render, screen} from "@testing-library/react-native";
import {ThosPortalScreen, ThosScreen} from "../src/ui/home/thos";
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
const nav = {navigate: jest.fn(), goBack: jest.fn()} as unknown as RootNav;
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
	await fireEvent.press(screen.getByText("快捷服务"));
	expect(
		screen.getByText("还没有快捷服务，去全部服务收藏常用事项。"),
	).toBeTruthy();
	await fireEvent.press(screen.getByText("去全部服务"));
	expect(screen.getByText("测试入校")).toBeTruthy();
	expect(screen.getByText("测试场地")).toBeTruthy();
	await fireEvent.press(screen.getAllByText("收藏服务")[0]);
	expect(AsyncStorage.setItem).toHaveBeenCalledWith(
		"thos-favorites:synthetic-user",
		"[\"synthetic-a\"]",
	);
	await fireEvent.press(screen.getByText("快捷服务"));
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
test("blank page gets a recovery message after 25 seconds", async () => {
	jest.useFakeTimers();
	await render(portal());
	await fireEvent(screen.getByTestId("thos-webview"), "loadStart");
	await act(async () => {
		jest.advanceTimersByTime(25000);
	});
	expect(screen.getByTestId("thos-portal-error").props.children).toContain(
		"长时间没有显示内容",
	);
	expect(helper.prepareThosSession).toHaveBeenCalledTimes(1);
});
test("only target-page rendering health clears the timeout", async () => {
	jest.useFakeTimers();
	await render(portal());
	await fireEvent(screen.getByTestId("thos-webview"), "loadStart");
	await fireEvent(screen.getByTestId("thos-webview"), "message", {
		nativeEvent: {
			url: THOS_HOME,
			data: JSON.stringify({type: "thos-render-health", visible: true}),
		},
	});
	await act(async () => {
		jest.advanceTimersByTime(25000);
	});
	expect(screen.queryByTestId("thos-portal-error")).toBeNull();
});
test("late rendering clears the blank-page warning after an official university redirect", async () => {
	jest.useFakeTimers();
	await render(portal());
	await fireEvent(screen.getByTestId("thos-webview"), "loadStart");
	await act(async () => {
		jest.advanceTimersByTime(25000);
	});
	expect(screen.getByTestId("thos-portal-error")).toBeTruthy();
	await fireEvent(screen.getByTestId("thos-webview"), "message", {
		nativeEvent: {
			url: "https://webvpn.tsinghua.edu.cn/http/university-proxy/fp/view",
			data: JSON.stringify({type: "thos-render-health", visible: true}),
		},
	});
	expect(screen.queryByTestId("thos-portal-error")).toBeNull();
});
test("untrusted rendering messages cannot dismiss the blank-page warning", async () => {
	jest.useFakeTimers();
	await render(portal());
	await fireEvent(screen.getByTestId("thos-webview"), "loadStart");
	await act(async () => {
		jest.advanceTimersByTime(25000);
	});
	await fireEvent(screen.getByTestId("thos-webview"), "message", {
		nativeEvent: {
			url: "https://tsinghua.edu.cn.example.com/fp/view",
			data: JSON.stringify({type: "thos-render-health", visible: true}),
		},
	});
	expect(screen.getByTestId("thos-portal-error")).toBeTruthy();
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
	expect(screen.getByText("尚未读取，不能视为空列表")).toBeTruthy();
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
	await fireEvent.press(screen.getByText(nativeTask.title));
	expect(nav.navigate).toHaveBeenLastCalledWith("ThosTaskDetail", {
		task: nativeTask,
		accountId: "synthetic-user",
	});
	await fireEvent.press(screen.getByText("服务中心"));
	await fireEvent.press(screen.getByText(nativeService.name));
	expect(nav.navigate).toHaveBeenLastCalledWith("ThosServiceDetail", {
		service: nativeService,
		accountId: "synthetic-user",
	});
	expect(nav.navigate).toHaveBeenCalledTimes(2);
});

test("native task detail shows actual node and unknown progress until explicit website navigation", async () => {
	await render(taskDetail());
	expect(screen.getByTestId("thos-native-detail")).toBeTruthy();
	expect(screen.getByText("合成测试节点")).toBeTruthy();
	expect(screen.getByText("系统未提供进度百分比")).toBeTruthy();
	expect(screen.queryByTestId("thos-webview")).toBeNull();
	expect(helper.prepareThosSession).not.toHaveBeenCalled();
	expect(nav.navigate).not.toHaveBeenCalled();
	await fireEvent.press(screen.getByText("进入在线服务网站"));
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
	expect(screen.getAllByText("系统未提供")).toHaveLength(2);
	expect(screen.queryByTestId("thos-webview")).toBeNull();
	jest
		.mocked(helper.getThosServices)
		.mockResolvedValue({
			items: [{...nativeService, kind: "group", inOpenPeriod: false}],
			total: 1,
			complete: true,
		});
	await fireEvent.press(screen.getByText("刷新详情"));
	expect(screen.getByText("服务集合")).toBeTruthy();
	expect(screen.getByText("不在开放时间内")).toBeTruthy();
	expect(nav.navigate).not.toHaveBeenCalled();
});

test("a moved task retains last known information with an explicit refresh error", async () => {
	await render(taskDetail());
	await fireEvent.press(screen.getByText("刷新详情"));
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
		refresh = fireEvent.press(screen.getByText("刷新详情"));
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
