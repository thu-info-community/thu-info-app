import React from "react";
import {afterEach, expect, jest, test} from "@jest/globals";
import {cleanup, fireEvent, render, screen} from "@testing-library/react-native";
import {PrimaryButton} from "../src/components/subpage/buttons";
import {
	DetailRow,
	ErrorState,
	SettingRow,
} from "../src/components/subpage/rows";

jest.mock("../src/redux/store", () => ({
	currState: () => ({config: {language: "zh", darkMode: false}}),
}));
jest.mock("../src/utils/easterEgg", () => ({enableEasterEgg: () => false}));

afterEach(async () => {
	await cleanup();
});

test("PrimaryButton does not fire onPress while disabled", async () => {
	const onPress = jest.fn();
	await render(<PrimaryButton text="提交" onPress={onPress} disabled />);
	await fireEvent.press(screen.getByText("提交"));
	expect(onPress).not.toHaveBeenCalled();
});

test("PrimaryButton fires onPress when enabled", async () => {
	const onPress = jest.fn();
	await render(<PrimaryButton text="提交" onPress={onPress} />);
	await fireEvent.press(screen.getByText("提交"));
	expect(onPress).toHaveBeenCalledTimes(1);
});

test("DetailRow renders its label and value", async () => {
	await render(<DetailRow label="学号" value="2021000000" />);
	expect(screen.getByText("学号")).toBeTruthy();
	expect(screen.getByText("2021000000")).toBeTruthy();
});

test("DetailRow renders an em dash for an empty value", async () => {
	await render(<DetailRow label="备注" value="" />);
	expect(screen.getByText("—")).toBeTruthy();
});

test("ErrorState invokes onRetry with the supplied label", async () => {
	const onRetry = jest.fn();
	await render(
		<ErrorState onRetry={onRetry} message="加载失败" retryLabel="重试" />,
	);
	await fireEvent.press(screen.getByText("重试"));
	expect(onRetry).toHaveBeenCalledTimes(1);
});

test("SettingRow renders its label and fires onPress", async () => {
	const onPress = jest.fn();
	await render(<SettingRow text="深色模式" onPress={onPress} rightText="自动" />);
	expect(screen.getByText("深色模式")).toBeTruthy();
	expect(screen.getByText("自动")).toBeTruthy();
	await fireEvent.press(screen.getByText("深色模式"));
	expect(onPress).toHaveBeenCalledTimes(1);
});
