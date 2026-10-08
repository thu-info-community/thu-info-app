import React from "react";
import {afterEach, beforeEach, expect, jest, test} from "@jest/globals";
import {cleanup, fireEvent, render, screen} from "@testing-library/react-native";
import {PopiScreen} from "../src/ui/settings/popi";
import {helper} from "../src/redux/store";
import {getStr} from "../src/utils/i18n";
import {Feedback} from "@thu-info/lib/src/models/app/feedback";
import type {RootNav} from "../src/components/Root";

jest.mock("../src/redux/store", () => ({
	helper: {getFeedbackReplies: jest.fn()},
	currState: () => ({config: {language: "zh", darkMode: false}}),
}));
jest.mock("../src/utils/easterEgg", () => ({enableEasterEgg: () => false}));
jest.mock("../src/components/themedRefreshControl", () => ({
	ThemedRefreshControl: require("react-native").RefreshControl,
}));
jest.mock("react-native-snackbar", () => ({
	Snackbar: {show: jest.fn(), LENGTH_SHORT: 0, LENGTH_LONG: 0},
}));

const navigation = {navigate: jest.fn()} as unknown as RootNav;
const popiScreen = () => <PopiScreen navigation={navigation} />;

const answered: Feedback[] = [
	{
		content: "为什么我的课表是空的？",
		reply: "请在设置里选择正确的学期。",
		replierName: "管理员",
		repliedTime: "2026-09-01 10:00",
	},
];

beforeEach(() => {
	jest.mocked(helper.getFeedbackReplies).mockReset();
});

afterEach(async () => {
	await cleanup();
});

test("renders answered questions and reveals the reply on tap", async () => {
	jest.mocked(helper.getFeedbackReplies).mockResolvedValue(answered);
	await render(popiScreen());

	await screen.findByText("为什么我的课表是空的？");

	// Collapsed: the reply body is not visible yet.
	expect(screen.queryByText("请在设置里选择正确的学期。")).toBeNull();

	await fireEvent.press(screen.getByLabelText("为什么我的课表是空的？"));

	expect(screen.getByText(getStr("popiAnswer"))).toBeTruthy();
	expect(screen.getByText("请在设置里选择正确的学期。")).toBeTruthy();
	expect(screen.getAllByText(/管理员/).length).toBeGreaterThan(0);
	expect(screen.getAllByText(/2026-09-01 10:00/).length).toBeGreaterThan(0);
});

test("marks unanswered questions as pending", async () => {
	jest.mocked(helper.getFeedbackReplies).mockResolvedValue([
		{
			content: "能否支持导出成绩单？",
			reply: "",
			replierName: "",
			repliedTime: "",
		},
	]);
	await render(popiScreen());

	await screen.findByText("能否支持导出成绩单？");
	expect(screen.getByText(getStr("popiPending"))).toBeTruthy();
});

test("shows an empty state when there are no answered questions", async () => {
	jest.mocked(helper.getFeedbackReplies).mockResolvedValue([]);
	await render(popiScreen());

	await screen.findByText(getStr("popiEmpty"));
	expect(screen.getByText(getStr("popiEmptyHint"))).toBeTruthy();
});

test("shows a retryable error when the first load fails", async () => {
	jest.mocked(helper.getFeedbackReplies).mockRejectedValue(new Error("boom"));
	await render(popiScreen());

	await screen.findByText(getStr("idLoadFailed"));

	jest.mocked(helper.getFeedbackReplies).mockResolvedValue(answered);
	await fireEvent.press(screen.getByText(getStr("idRetry")));

	await screen.findByText("为什么我的课表是空的？");
});
