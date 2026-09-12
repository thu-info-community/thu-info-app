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
import {StyleSheet} from "react-native";
import dayjs from "dayjs";
import {ScheduleScreen} from "../src/ui/schedule/schedule";
import {
	configReducer,
	configSet,
	defaultConfig,
} from "../src/redux/slices/config";
import {scheduleReducer} from "../src/redux/slices/schedule";
import {
	Schedule,
	ScheduleType,
} from "@thu-info/lib/src/models/schedule/schedule";

jest.mock("uuid", () => ({v4: () => "schedule-screen-test"}));
jest.mock("../src/redux/store", () => ({
	currState: () => ({config: {language: "zh", darkMode: false}}),
	helper: {getSchedule: () => new Promise(() => {})},
}));
jest.mock("../src/utils/easterEgg", () => ({enableEasterEgg: () => false}));
jest.mock("../src/utils/useDetailNavigator", () => ({
	__esModule: true,
	default: () => undefined,
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
});
afterEach(async () => {
	await cleanup();
	jest.clearAllTimers();
	jest.useRealTimers();
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
				baseSchedule: plans,
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
