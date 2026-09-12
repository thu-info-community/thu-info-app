import {autumn, summer, plan as customPlan, time} from "./fixtures/schedules";
import {storeSchedule} from "../src/redux/scheduleData";
import React from "react";
import {expect, jest, test, beforeEach, afterEach} from "@jest/globals";
import {
	act,
	render,
	screen,
	fireEvent,
	cleanup,
} from "@testing-library/react-native";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import {StyleSheet, Alert} from "react-native";
import {getStr} from "../src/utils/i18n";
import dayjs from "dayjs";
import {ScheduleScreen} from "../src/ui/schedule/schedule";
import {
	configReducer,
	configSet,
	defaultConfig,
	setCalendarConfig,
} from "../src/redux/slices/config";
import {scheduleReducer, scheduleAddCustom} from "../src/redux/slices/schedule";
import {
	Schedule,
	ScheduleType,
} from "@thu-info/lib/src/models/schedule/schedule";

const mockNavigate = jest.fn();
const mockSnackbar = jest.fn();
jest.mock("react-native-snackbar", () => ({Snackbar: {show: (...args: unknown[]) => mockSnackbar(...args), LENGTH_SHORT: 0, LENGTH_LONG: 0}}));
const mockGetSchedule = jest.fn<(...args: any[]) => Promise<any>>();
let mockScheduleResponses: ((result: any) => void)[] = [];
const mockDetailDispatch = jest.fn();
let mockUseDetail = false;
jest.mock("@react-navigation/native", () => ({
	...jest.requireActual<typeof import("@react-navigation/native")>(
		"@react-navigation/native",
	),
	useNavigation: () => ({navigate: mockNavigate}),
}));
jest.mock("uuid", () => ({v4: () => "schedule-screen-test"}));
jest.mock("../src/redux/store", () => ({
	currState: () => ({config: {language: "zh", darkMode: false}}),
	helper: {getSchedule: (...args: any[]) => mockGetSchedule(...args)},
}));
jest.mock("../src/utils/easterEgg", () => ({enableEasterEgg: () => false}));
jest.mock("../src/utils/useDetailNavigator", () => ({
	__esModule: true,
	default: () => (mockUseDetail ? {dispatch: mockDetailDispatch} : undefined),
}));
jest.mock("../src/utils/calendar", () => ({exportScheduleToICS: jest.fn()}));
jest.mock("../src/components/themedRefreshControl", () => ({
	ThemedGestureRefreshControl: () => null,
}));
jest.mock("../src/components/views", () => ({
	BottomPopupTriggerView: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock("../src/components/schedule/scheduleAdd", () => ({
	ScheduleAddModal: (props: object) =>
		require("react").createElement(require("react-native").View, {
			...props,
			testID: "add-modal",
		}),
}));

beforeEach(() => {
	jest.useFakeTimers();
	mockScheduleResponses = [];
	mockGetSchedule.mockReset().mockImplementation(() => new Promise((resolve) => mockScheduleResponses.push(resolve)));
	mockNavigate.mockClear();
	mockSnackbar.mockClear();
	mockDetailDispatch.mockClear();
	mockUseDetail = false;
});
afterEach(async () => {
	await cleanup();
	jest.clearAllTimers();
	jest.useRealTimers();
	jest.restoreAllMocks();
});

const firstDay = dayjs().startOf("day").format("YYYY-MM-DD");
const plan = (day: number, week: number): Schedule => {
	const date = dayjs(firstDay).add((week - 1) * 7 + day - 1, "day");
	return {
		name: `午间计划-${day}-${week}`,
		type: ScheduleType.CUSTOM,
		location: "教室",
		hash: `plan-${day}-${week}`,
		activeTime: {
			base: [
				{
					dayOfWeek: day,
					beginTime: date.hour(12).minute(20),
					endTime: date.hour(12).minute(40),
				},
			],
		},
		delOrHideTime: {base: []},
	};
};
const height = (id: string) =>
	StyleSheet.flatten(screen.getByTestId(id).props.style).height as number;
const setup = async (plans: Schedule[]) => {
	const store = configureStore({
		reducer: {config: configReducer, schedule: scheduleReducer},
		preloadedState: {
			config: {...defaultConfig, firstDay, weekCount: 2},
			schedule: {
				baseSchedule: plans.map((entry) => ({...storeSchedule(entry), localId: entry.hash})),
				overrides: {},
				pendingUploads: [],
				shortenMap: {},
				customCnt: 1,
				semesterId: defaultConfig.semesterId,
			},
		},
	});
	await render(
		<Provider store={store}>
			<ScheduleScreen />
		</Provider>,
	);
	await fireEvent(screen.getByTestId("schedule-scroll"), "layout", {
		nativeEvent: {layout: {height: 630, width: 700}},
	});
	return store;
};

test("week paging synchronizes the axis height and gap additions use the clicked page's date", async () => {
	const store = await setup([plan(1, 1)]);
	const withGap = height("schedule-page-0");
	const withoutGap = height("schedule-page-1");
	expect(withGap - withoutGap).toBeCloseTo(52);
	expect(height("schedule-time-axis")).toBe(withGap);
	const pager = screen.getByTestId("schedule-weeks");
	const width = StyleSheet.flatten(pager.props.style).width;
	await fireEvent(pager, "scroll", {
		nativeEvent: {
			contentOffset: {x: width, y: 0},
			contentSize: {width: width * 2, height: withGap},
			layoutMeasurement: {width, height: withGap},
		},
	});
	expect(height("schedule-time-axis")).toBe(withoutGap);
	expect(height("schedule-weeks")).toBe(withoutGap);
	await fireEvent(screen.getByTestId("schedule-add-0"), "pressIn", {
		nativeEvent: {locationX: 5, locationY: 260},
	});
	await fireEvent.press(screen.getByTestId("schedule-add-0"));
	expect(screen.getByTestId("add-modal").props).toMatchObject({
		visible: true,
		defaultUseCustomDateTime: true,
		defaultDateIndex: 0,
		defaultBeginHour: 12,
		defaultBeginMinute: 15,
		defaultEndMinute: 45,
	});
	await act(() => {
		store.dispatch(configSet({key: "scheduleUseClassPeriods", value: false}));
	});
	expect(screen.getByText("24:00")).toBeTruthy();
});

test("hidden weekends and filtered custom plans no longer contribute empty gap space", async () => {
	const store = await setup([plan(6, 1)]);
	const expanded = height("schedule-page-0");
	await act(() => {
		store.dispatch(configSet({key: "hideWeekend", value: true}));
	});
	expect(height("schedule-page-0")).toBeCloseTo(expanded - 52);
	await act(() => {
		store.dispatch(configSet({key: "hideWeekend", value: false}));
	});
	expect(height("schedule-page-0")).toBe(expanded);
	await act(() => {
		store.dispatch(configSet({key: "showCustomSchedule", value: false}));
	});
	expect(height("schedule-page-0")).toBeCloseTo(expanded - 52);
});

const openSettings = async () => {
	await fireEvent.press(
		screen.getByRole("button", {name: getStr("scheduleSettings")}),
	);
};

test("all schedule preferences live in the scrollable popup and controls keep it open", async () => {
	const store = await setup([]);
	await openSettings();
	expect(screen.getByTestId("schedule-settings-scroll")).toBeTruthy();
	expect(screen.getAllByText("按节次显示")).toHaveLength(1);
	expect(screen.getByText("日程高度")).toBeTruthy();
	expect(screen.getByText("使用半透明 UI")).toBeTruthy();
	await fireEvent(
		screen.getByRole("switch", {name: getStr("enableNewUI")}),
		"valueChange",
		false,
	);
	expect(store.getState().config.scheduleEnableNewUI).toBe(false);
	await act(() => {
		store.dispatch(configSet({key: "scheduleEnableNewUI", value: undefined}));
	});
	expect(
		screen.getByRole("switch", {name: getStr("enableNewUI")}).props.value,
	).toBe(false);
	expect(screen.getByTestId("schedule-settings")).toBeTruthy();
	await fireEvent.press(screen.getByTestId("schedule-settings-backdrop"));
	expect(screen.queryByTestId("schedule-settings")).toBeNull();
});

test("hidden schedule management closes the popup and uses phone navigation", async () => {
	await setup([]);
	await openSettings();
	await fireEvent.press(
		screen.getByRole("button", {name: getStr("scheduleHidden")}),
	);
	expect(mockNavigate).toHaveBeenCalledWith("ScheduleHidden");
	expect(screen.queryByTestId("schedule-settings")).toBeNull();
});

test.each([true, false])(
	"schedule sync retains sending=%s and closes only after choosing a role",
	async (isSending) => {
		const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
		await setup([]);
		await openSettings();
		await fireEvent.press(
			screen.getByRole("button", {name: getStr("scheduleSync")}),
		);
		expect(screen.getByTestId("schedule-settings")).toBeTruthy();
		const buttons = alert.mock.calls[0][2]!;
		await act(() => {
			buttons[isSending ? 0 : 1].onPress!();
		});
		expect(mockNavigate).toHaveBeenCalledWith("ScheduleSync", {isSending});
		expect(screen.queryByTestId("schedule-settings")).toBeNull();
	},
);

test("tablet settings navigation targets the detail pane", async () => {
	mockUseDetail = true;
	await setup([]);
	await openSettings();
	await fireEvent.press(
		screen.getByRole("button", {name: getStr("scheduleHidden")}),
	);
	expect(mockDetailDispatch).toHaveBeenCalledWith(
		expect.objectContaining({
			type: "REPLACE",
			payload: {name: "ScheduleHidden", params: {disableAnimation: true}},
		}),
	);
	expect(mockNavigate).not.toHaveBeenCalled();
});


test("a stale semester response cannot overwrite the latest selection", async () => {
	const store = await setup([]);
	await act(() => {store.dispatch(setCalendarConfig({...autumn, semesterName: "秋季", nextSemesterIndex: 0}));});
	expect(mockScheduleResponses).toHaveLength(2);
	const calendar = {...summer, semesterName: "夏季", nextSemesterList: [{...autumn, semesterName: "秋季"}]};
	await act(async () => {mockScheduleResponses[1]({calendar, schedule: []});});
	expect(store.getState().schedule.semesterId).toBe(autumn.semesterId);
	await act(async () => {mockScheduleResponses[0]({calendar, schedule: [customPlan()]});});
	expect(store.getState().config.semesterId).toBe(autumn.semesterId);
	expect(store.getState().schedule.baseSchedule).toEqual([]);
});

test("the same persisted summer Sunday is absent from the autumn grid", async () => {
	const store = await setup([]);
	await act(() => {
		store.dispatch(setCalendarConfig({...autumn, semesterName: "秋季", nextSemesterIndex: undefined}));
		store.dispatch(scheduleAddCustom(customPlan([time("2025-09-14")], {name: "夏季周日"})));
	});
	expect(screen.queryByText("夏季周日")).toBeNull();
	expect(store.getState().schedule.baseSchedule).toHaveLength(1);
});


test("failed refresh retains the current schedule and reports the failure", async () => {
	mockGetSchedule.mockRejectedValueOnce(new Error("offline"));
	const store = await setup([plan(1, 1)]);
	await act(async () => {});
	expect(store.getState().schedule.baseSchedule).toHaveLength(1);
	expect(mockSnackbar).toHaveBeenCalledWith(expect.objectContaining({text: "offline"}));
	expect(screen.getByTestId("schedule-scroll").props.refreshControl.props.refreshing).toBe(false);
});
