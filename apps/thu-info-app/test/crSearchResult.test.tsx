import React from "react";
import {afterEach, beforeEach, expect, jest, test} from "@jest/globals";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react-native";
import {CrSearchResultScreen} from "../src/ui/home/crSearchResult";
import {helper} from "../src/redux/store";
import {NetworkRetry} from "../src/components/easySnackbars";
import {MOCK_CR_SEARCH_RESULT} from "@thu-info/lib/src/mocks/cr";
import type {RootNav} from "../src/components/Root";

jest.mock("../src/redux/store", () => ({
	helper: {searchCrCourses: jest.fn()},
	currState: () => ({config: {language: "zh", darkMode: false}}),
}));
jest.mock("../src/utils/easterEgg", () => ({enableEasterEgg: () => false}));
jest.mock("../src/components/themedRefreshControl", () => ({
	ThemedRefreshControl: require("react-native").RefreshControl,
}));
jest.mock("../src/components/easySnackbars", () => ({NetworkRetry: jest.fn()}));

const params = {semester: "2026-2027-1"};
const course = MOCK_CR_SEARCH_RESULT.courses[0];
const searchScreen = () => (
	<CrSearchResultScreen
		route={{
			key: "cr-search-result",
			name: "CrSearchResult",
			params: {searchParams: params},
		}}
		navigation={{} as RootNav}
	/>
);

beforeEach(() => {
	jest.mocked(helper.searchCrCourses).mockReset();
	jest.mocked(NetworkRetry).mockClear();
});
afterEach(async () => {
	await cleanup();
});

test.each([
	{
		remaining: 25,
		capacity: 30,
		queue: 2,
		remainingText: "25/30",
		queueText: "2",
	},
	{remaining: 0, capacity: 30, queue: 0, remainingText: "0/30", queueText: "0"},
	{
		remaining: NaN,
		capacity: 30,
		queue: NaN,
		remainingText: "--/30",
		queueText: "--",
	},
	{
		remaining: NaN,
		capacity: NaN,
		queue: NaN,
		remainingText: "--/--",
		queueText: "--",
	},
])(
	"shows remaining $remainingText and queue $queueText",
	async ({remaining, capacity, queue, remainingText, queueText}) => {
		jest.mocked(helper.searchCrCourses).mockResolvedValueOnce({
			currPage: 1,
			totalPage: 1,
			totalCount: 1,
			courses: [{...course, remaining, capacity, queue}],
		});

		await render(searchScreen());

		expect(screen.getByText(`课余量 ${remainingText}`)).toBeTruthy();
		expect(screen.getByText(`队列人数 ${queueText}`)).toBeTruthy();
		expect(helper.searchCrCourses).toHaveBeenCalledWith({...params, page: 1});
	},
);

test("paginates the open-course results and replaces them on refresh", async () => {
	jest
		.mocked(helper.searchCrCourses)
		.mockResolvedValueOnce({
			currPage: 1,
			totalPage: 2,
			totalCount: 2,
			courses: [course],
		})
		.mockResolvedValueOnce({
			currPage: 2,
			totalPage: 2,
			totalCount: 2,
			courses: [{...course, seq: 91, name: "Second Course"}],
		})
		.mockResolvedValueOnce({
			currPage: 1,
			totalPage: 1,
			totalCount: 1,
			courses: [course],
		});
	await render(searchScreen());
	await fireEvent(screen.getByTestId("cr-search-results"), "endReached");

	expect(screen.getByText("Second Course")).toBeTruthy();
	expect(helper.searchCrCourses).toHaveBeenNthCalledWith(2, {
		...params,
		page: 2,
	});
	await fireEvent(screen.getByTestId("cr-search-results"), "endReached");
	expect(helper.searchCrCourses).toHaveBeenCalledTimes(2);
	await act(async () => {
		screen
			.getByTestId("cr-search-results")
			.props.refreshControl.props.onRefresh();
	});

	expect(screen.queryByText("Second Course")).toBeNull();
	expect(helper.searchCrCourses).toHaveBeenNthCalledWith(3, {
		...params,
		page: 1,
	});
});

test("does not request another page before the first page finishes", async () => {
	let resolveFirst!: (result: typeof MOCK_CR_SEARCH_RESULT) => void;
	jest.mocked(helper.searchCrCourses).mockImplementationOnce(
		() =>
			new Promise((resolve) => {
				resolveFirst = resolve;
			}),
	);
	await render(searchScreen());
	await fireEvent(screen.getByTestId("cr-search-results"), "endReached");

	expect(helper.searchCrCourses).toHaveBeenCalledTimes(1);
	await act(async () => {
		resolveFirst({
			...MOCK_CR_SEARCH_RESULT,
			totalPage: 2,
			totalCount: 2,
			courses: [course],
		});
	});
	expect(screen.getByText(course.name)).toBeTruthy();
});

test("finishes refreshing after a query error", async () => {
	const error = new Error("Search unavailable");
	jest.mocked(helper.searchCrCourses).mockRejectedValueOnce(error);

	await render(searchScreen());

	expect(NetworkRetry).toHaveBeenCalledWith(error);
	expect(
		screen.getByTestId("cr-search-results").props.refreshControl.props
			.refreshing,
	).toBe(false);
});

test("handles an empty search result", async () => {
	jest.mocked(helper.searchCrCourses).mockResolvedValueOnce({
		currPage: 1,
		totalPage: 1,
		totalCount: 0,
		courses: [],
	});

	await render(searchScreen());

	expect(screen.queryByText(course.name)).toBeNull();
	expect(
		screen.getByTestId("cr-search-results").props.refreshControl.props
			.refreshing,
	).toBe(false);
});
