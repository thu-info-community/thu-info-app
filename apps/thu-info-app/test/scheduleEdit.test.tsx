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
jest.mock("../src/components/views", () => ({
	RoundedView: ({children}: {children: React.ReactNode}) => children,
	BottomPopupTriggerView: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock("../src/components/keyboardAvoidingScreen", () => ({
	KeyboardAvoidingScreen: ({children}: {children: React.ReactNode}) => children,
}));
jest.mock("react-native-wheel-scrollview-picker", () => () => null);
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
