import React from "react";
import {expect, jest, test} from "@jest/globals";
import {render, screen, fireEvent} from "@testing-library/react-native";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import {
	ScheduleBlock,
	SchedulePeriodSwitch,
	ScheduleTimeAxis,
} from "../src/components/schedule/schedule";
import {configReducer, defaultConfig} from "../src/redux/slices/config";
import {buildScheduleLayout} from "../src/utils/scheduleLayout";

jest.mock("uuid", () => ({v4: () => "schedule-test"}));
jest.mock("../src/redux/store", () => ({
	currState: () => ({config: {language: "zh", darkMode: false}}),
}));
jest.mock("../src/utils/easterEgg", () => ({enableEasterEgg: () => false}));

test("both switches share state, old configs default on and an explicit off survives restoration", async () => {
	const store = configureStore({
		reducer: {config: configReducer},
		preloadedState: {
			config: {...defaultConfig, scheduleUseClassPeriods: undefined},
		},
	});
	const rendered = await render(
		<Provider store={store}>
			<SchedulePeriodSwitch />
			<SchedulePeriodSwitch notice />
		</Provider>,
	);
	expect(
		screen.getAllByRole("switch").map((control) => control.props.value),
	).toEqual([true, true]);
	await fireEvent(screen.getAllByRole("switch")[0], "valueChange", false);
	expect(
		screen.getAllByRole("switch").map((control) => control.props.value),
	).toEqual([false, false]);
	const restored = configureStore({
		reducer: {config: configReducer},
		preloadedState: JSON.parse(JSON.stringify(store.getState())) as ReturnType<
			typeof store.getState
		>,
	});
	await rendered.unmount();
	await render(
		<Provider store={restored}>
			<SchedulePeriodSwitch />
		</Provider>,
	);
	expect(screen.getByRole("switch").props.value).toBe(false);
});

test("compact and expanded cards keep their original actions after changing size", async () => {
	const onPress = jest.fn();
	const onLongPress = jest.fn();
	const props = {
		dayOfWeek: 1,
		top: 225,
		height: 52,
		gridWidth: 90,
		name: "午间计划",
		location: "教室",
		timeLabel: "12:20–12:40",
		onPress,
		onLongPress,
	};
	const rendered = await render(<ScheduleBlock {...props} />);
	expect(screen.getByText("12:20–12:40")).toBeTruthy();
	await fireEvent.press(screen.getByRole("button"));
	await rendered.rerender(
		<ScheduleBlock {...props} top={90} height={28} compact />,
	);
	expect(screen.queryByText("12:20–12:40")).toBeNull();
	expect(screen.getByRole("button").props.accessibilityLabel).toContain(
		"12:20–12:40",
	);
	await fireEvent(screen.getByRole("button"), "longPress");
	await rendered.rerender(<ScheduleBlock {...props} height={80} />);
	expect(screen.getByText("12:20–12:40")).toBeTruthy();
	await rendered.rerender(
		<ScheduleBlock {...props} gridWidth={46} height={64} />,
	);
	expect(screen.getByText("12:20\n12:40")).toBeTruthy();
	expect(onPress).toHaveBeenCalledTimes(1);
	expect(onLongPress).toHaveBeenCalledTimes(1);
});

test("the axis switches from 14 periods to hourly labels", async () => {
	const options = {
		classPeriods: true,
		periodHeight: 45,
		minuteHeight: 1,
		startMinute: 480,
	};
	const periods = buildScheduleLayout([], options);
	const rendered = await render(
		<ScheduleTimeAxis
			rows={periods.rows}
			height={periods.height}
			classPeriods
			heightMode={2}
		/>,
	);
	expect(screen.getByText("14")).toBeTruthy();
	expect(screen.getByText("21:45")).toBeTruthy();
	const daily = buildScheduleLayout([], {...options, classPeriods: false});
	await rendered.rerender(
		<ScheduleTimeAxis
			rows={daily.rows}
			height={daily.height}
			classPeriods={false}
			heightMode={2}
		/>,
	);
	expect(screen.queryByText("14")).toBeNull();
	expect(screen.getByText("24:00")).toBeTruthy();
});
