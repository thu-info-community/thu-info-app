import React from "react";
import {afterEach, expect, jest, test} from "@jest/globals";
import {
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react-native";
import {ReportScreen} from "../src/ui/home/report";
import {Provider} from "react-redux";
import {configureStore} from "@reduxjs/toolkit";
import {configReducer} from "../src/redux/slices/config";

jest.mock("../src/redux/store", () => ({
	currState: () => ({config: {language: "zh", darkMode: false}}),
	helper: {
		graduate: () => false,
		getReport: () =>
			Promise.resolve([
				{name: "专题研讨", credit: 2, grade: "A", point: 4, semester: "2024秋"},
				{name: "专题研讨", credit: 1, grade: "B", point: 3, semester: "2025春"},
			]),
	},
}));
jest.mock("../src/utils/easterEgg", () => ({enableEasterEgg: () => false}));
jest.mock("../src/assets/icons/IconExchange", () => {
	const React = require("react");
	const {Text} = require("react-native");
	return () => <Text>切换成绩显示模式</Text>;
});
afterEach(async () => {
	await cleanup();
});

test("switching report modes preserves semester labels for courses with the same name", async () => {
	const store = configureStore({reducer: {config: configReducer}});
	await render(
		<Provider store={store}>
			<ReportScreen />
		</Provider>,
	);
	expect(screen.getAllByText("专题研讨")).toHaveLength(2);
	await fireEvent.press(screen.getByText("切换成绩显示模式"));
	expect(screen.getByText("[2024秋] 专题研讨")).toBeTruthy();
	expect(screen.getByText("[2025春] 专题研讨")).toBeTruthy();
	await fireEvent.press(screen.getByText("切换成绩显示模式"));
	expect(screen.getAllByText("专题研讨")).toHaveLength(2);
});
