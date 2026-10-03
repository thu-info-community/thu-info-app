import React from "react";
import {afterEach, expect, jest, test} from "@jest/globals";
import {
	render,
	screen,
	fireEvent,
	act,
	cleanup,
} from "@testing-library/react-native";
import {Alert} from "react-native";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import {ScheduleAddModal} from "../src/components/schedule/scheduleAdd";
import {scheduleReducer, scheduleAddCustom} from "../src/redux/slices/schedule";
import {defaultConfig, configReducer} from "../src/redux/slices/config";
import {getStr} from "../src/utils/i18n";
import {autumn, plan, time} from "./fixtures/schedules";

let mockId = 0;
jest.mock("uuid", () => ({v4: () => String(++mockId)}));
jest.mock("../src/redux/store", () => ({
	currState: () => ({config: {language: "zh", darkMode: false}}),
	helper: {},
}));
jest.mock("../src/utils/easterEgg", () => ({enableEasterEgg: () => false}));
jest.mock("../src/components/views", () => {
	const React = require("react");
	const {View, TouchableOpacity} = require("react-native");
	return {
		RoundedView: ({children}: {children: React.ReactNode}) => children,
		BottomPopupTriggerView: ({
			children,
			popupContent,
			popupOnFulfilled,
			popupOnCancelled,
			popupCanFulfill,
		}: any) => {
			const [open, setOpen] = React.useState(false);
			return (
				<View>
					<TouchableOpacity onPress={() => setOpen(true)}>
						{children}
					</TouchableOpacity>
					{open && (
						<View>
							{popupContent}
							<TouchableOpacity
								testID="picker-confirm"
								disabled={!popupCanFulfill}
								onPress={() => {
									popupOnFulfilled();
									setOpen(false);
								}}
							/>
							<TouchableOpacity
								testID="picker-cancel"
								onPress={() => {
									popupOnCancelled();
									setOpen(false);
								}}
							/>
						</View>
					)}
				</View>
			);
		},
	};
});
jest.mock("../src/components/keyboardAvoidingScreen", () => ({
	KeyboardAvoidingScreen: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock("react-native-wheel-scrollview-picker", () => {
	const React = require("react");
	const {View} = require("react-native");
	return (props: object) => <View {...props} testID="schedule-picker-wheel" />;
});
jest.mock("../src/utils/calendar", () => ({
	explainPeriod: () => "period",
	explainWeekList: () => "weeks",
}));
afterEach(async () => {
	await cleanup();
	jest.restoreAllMocks();
});

const setup = async () => {
	const store = configureStore({
		reducer: {schedule: scheduleReducer, config: configReducer},
		preloadedState: {config: {...defaultConfig, ...autumn}},
		middleware: (m) => m({serializableCheck: false}),
	});
	store.dispatch(
		scheduleAddCustom(plan([time("2025-09-17"), time("2025-09-24")])),
	);
	const target = store.getState().schedule.baseSchedule[0];
	const close = jest.fn();
	await render(
		<Provider store={store}>
			<ScheduleAddModal
				visible
				onClose={close}
				initialParams={{
					...target,
					...target.activeTime.base[0],
					week: 1,
					alias: "",
				}}
			/>
		</Provider>,
	);
	return {store, close};
};

const setupNew = async () => {
	const store = configureStore({
		reducer: {schedule: scheduleReducer, config: configReducer},
		preloadedState: {config: {...defaultConfig, ...autumn}},
		middleware: (m) => m({serializableCheck: false}),
	});
	const close = jest.fn();
	await render(
		<Provider store={store}>
			<ScheduleAddModal visible onClose={close} />
		</Provider>,
	);
	await fireEvent.changeText(
		screen.getByPlaceholderText(getStr("title")),
		"讨论会",
	);
	return {store, close};
};

test.each(["confirm", "cancel"] as const)(
	"%s applies only confirmed week and period selections when saving",
	async (action) => {
		const {store, close} = await setupNew();
		await fireEvent.press(screen.getByText(getStr("weeks")));
		await fireEvent.press(screen.getByText(getStr("oddWeeks")));
		await fireEvent.press(screen.getByTestId(`picker-${action}`));
		await fireEvent.press(screen.getByText(getStr("periods")));
		await fireEvent(
			screen.getAllByTestId("schedule-picker-wheel")[0],
			"valueChange",
			"",
			2,
		);
		await fireEvent(
			screen.getAllByTestId("schedule-picker-wheel")[1],
			"valueChange",
			"",
			5,
		);
		await fireEvent(
			screen.getAllByTestId("schedule-picker-wheel")[2],
			"valueChange",
			"",
			1,
		);
		await fireEvent.press(screen.getByTestId(`picker-${action}`));
		await fireEvent.press(screen.getByText(getStr("save")));
		const slices = store.getState().schedule.baseSchedule[0].activeTime.base;
		expect(slices).toHaveLength(action === "confirm" ? 9 : 18);
		expect(slices[0].beginTime.format("YYYY-MM-DD HH:mm")).toBe(
			action === "confirm" ? "2025-09-17 13:30" : "2025-09-15 08:00",
		);
		expect(slices[0].endTime.format("HH:mm")).toBe(
			action === "confirm" ? "15:05" : "21:45",
		);
		expect(close).toHaveBeenCalledTimes(1);
	},
);

test.each(["confirm", "cancel"] as const)(
	"%s keeps date and natural-time picker drafts separate from saved values",
	async (action) => {
		const {store, close} = await setupNew();
		await fireEvent.press(screen.getByText(getStr("scheduleAddModeDateTime")));
		await fireEvent.press(screen.getByText(getStr("scheduleDate")));
		await fireEvent(
			screen.getByTestId("schedule-picker-wheel"),
			"valueChange",
			"",
			2,
		);
		await fireEvent.press(screen.getByTestId(`picker-${action}`));
		await fireEvent.press(screen.getByText(getStr("scheduleTimeRange")));
		for (const [index, value] of [9, 10, 10, 20].entries()) {
			await fireEvent(
				screen.getAllByTestId("schedule-picker-wheel")[index],
				"valueChange",
				"",
				value,
			);
		}
		await fireEvent.press(screen.getByTestId(`picker-${action}`));
		await fireEvent.press(screen.getByText(getStr("save")));
		const slices = store.getState().schedule.baseSchedule[0].activeTime.base;
		expect(slices).toHaveLength(1);
		expect(slices[0].beginTime.format("YYYY-MM-DD HH:mm")).toBe(
			action === "confirm" ? "2025-09-17 09:10" : "2025-09-15 08:00",
		);
		expect(slices[0].endTime.format("HH:mm")).toBe(
			action === "confirm" ? "10:20" : "08:45",
		);
		expect(close).toHaveBeenCalledTimes(1);
	},
);

test("canceling the repeating edit dialog does not save title or location", async () => {
	const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
	const {store, close} = await setup();
	const before = store.getState().schedule;
	await fireEvent.changeText(screen.getByPlaceholderText("组会"), "讨论会");
	await fireEvent.changeText(screen.getByDisplayValue("A"), "B");
	await fireEvent.press(screen.getByText(getStr("save")));
	expect(alert).toHaveBeenCalledTimes(1);
	expect(store.getState().schedule).toBe(before);
	await act(() => {
		alert.mock.calls[0]
			[2]!.find((b) => b.text === getStr("cancel"))!
			.onPress?.();
	});
	expect(store.getState().schedule).toBe(before);
	expect(close).not.toHaveBeenCalled();
});

test.each(["scheduleEditOnce", "scheduleEditAllRepeat"] as const)(
	"%s scopes all fields and preserves natural-time occurrences",
	async (choice) => {
		const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});
		const {store, close} = await setup();
		await fireEvent.changeText(screen.getByPlaceholderText("组会"), "讨论会");
		await fireEvent.changeText(screen.getByDisplayValue("A"), "B");
		await fireEvent.press(screen.getByText(getStr("save")));
		await act(() => {
			alert.mock.calls[0][2]!.find((b) => b.text === getStr(choice))!
				.onPress!();
		});
		const entries = store.getState().schedule.baseSchedule;
		const changed = entries.find((s) => s.name === "讨论会")!;
		expect(changed.location).toBe("B");
		expect(
			changed.activeTime.base.map((s) =>
				s.beginTime.format("YYYY-MM-DD HH:mm"),
			),
		).toEqual(
			choice === "scheduleEditOnce"
				? ["2025-09-17 14:00"]
				: ["2025-09-17 14:00", "2025-09-24 14:00"],
		);
		if (choice === "scheduleEditOnce") {
			const untouched = entries.find((s) => s.name === "组会")!;
			expect(untouched.location).toBe("A");
			expect(
				untouched.activeTime.base[0].beginTime.format("YYYY-MM-DD HH:mm"),
			).toBe("2025-09-24 14:00");
		}
		expect(close).toHaveBeenCalledTimes(1);
	},
);
