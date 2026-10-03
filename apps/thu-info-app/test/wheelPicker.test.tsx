import React, {forwardRef, useImperativeHandle} from "react";
import {afterEach, beforeEach, expect, jest, test} from "@jest/globals";
import {act, cleanup, render, screen} from "@testing-library/react-native";
import {NativeScrollEvent, NativeSyntheticEvent, Platform, View} from "react-native";
import ScrollPicker from "react-native-wheel-scrollview-picker";

const scrollTo = jest.fn();
const PickerScrollView = forwardRef((props: object, ref) => {
	useImperativeHandle(ref, () => ({scrollTo}));
	return <View {...props} testID="picker-scroll" />;
});
const data = Array.from({length: 20}, (_, index) => String(index));
const event = (y: number) =>
	({nativeEvent: {contentOffset: {x: 0, y}}}) as NativeSyntheticEvent<NativeScrollEvent>;

beforeEach(() => {
	jest.useFakeTimers();
	scrollTo.mockClear();
	jest.replaceProperty(Platform, "OS", "harmony" as typeof Platform.OS);
});
afterEach(async () => {
	await cleanup();
	jest.useRealTimers();
	jest.restoreAllMocks();
});

const setup = async () => {
	const onChange = jest.fn();
	await render(
		<ScrollPicker
			dataSource={data}
			selectedIndex={10}
			itemHeight={48}
			onValueChange={onChange}
			scrollViewComponent={PickerScrollView}
		/>,
	);
	await act(() => jest.runOnlyPendingTimers());
	scrollTo.mockClear();
	return onChange;
};

test.each([
	["harmony", 470, 345, 7],
	["harmony", 490, 635, 13],
	["android", 470, 345, 7],
	["android", 490, 635, 13],
	["ios", 470, 345, 7],
	["ios", 490, 635, 13],
] as const)("%s momentum from %i to %i settles at the final row", async (platform, release, finish, index) => {
	jest.replaceProperty(Platform, "OS", platform as typeof Platform.OS);
	const onChange = await setup();
	await act(() => screen.getByTestId("picker-scroll").props.onScrollBeginDrag(event(480)));
	const handlers = screen.getByTestId("picker-scroll").props;
	await act(() => {
		handlers.onScrollEndDrag(event(release));
		handlers.onMomentumScrollBegin(event(release));
	});
	await act(() => jest.advanceTimersByTime(80));
	expect(scrollTo).not.toHaveBeenCalled();
	expect(onChange).not.toHaveBeenCalled();
	await act(() => screen.getByTestId("picker-scroll").props.onMomentumScrollEnd(event(finish)));
	expect(scrollTo).toHaveBeenLastCalledWith({y: index * 48});
	expect(onChange).toHaveBeenLastCalledWith(data[index], index);
});

test("a new drag cancels the previous release's pending alignment", async () => {
	const onChange = await setup();
	const handlers = screen.getByTestId("picker-scroll").props;
	await act(() => {
		handlers.onScrollEndDrag(event(355));
		handlers.onScrollBeginDrag(event(355));
	});
	await act(() => jest.advanceTimersByTime(80));
	expect(scrollTo).not.toHaveBeenCalled();
	expect(onChange).not.toHaveBeenCalled();
});

test("a release without momentum still aligns and changes the selection", async () => {
	const onChange = await setup();
	await act(() => screen.getByTestId("picker-scroll").props.onScrollEndDrag(event(355)));
	await act(() => jest.advanceTimersByTime(80));
	expect(scrollTo).toHaveBeenLastCalledWith({y: 336});
	expect(onChange).toHaveBeenLastCalledWith(data[7], 7);
});

test("closing the picker cancels a pending selection change", async () => {
	const onChange = await setup();
	await act(() => screen.getByTestId("picker-scroll").props.onScrollEndDrag(event(355)));
	await cleanup();
	await act(() => jest.advanceTimersByTime(80));
	expect(onChange).not.toHaveBeenCalled();
});

test("the last row does not animate again for a fractional boundary offset", async () => {
	const onChange = await setup();
	const boundary = event(19 * 48 - 0.0001);
	await act(() => screen.getByTestId("picker-scroll").props.onMomentumScrollEnd(boundary));
	expect(onChange).toHaveBeenLastCalledWith(data[19], 19);
	expect(scrollTo).not.toHaveBeenCalled();
	await act(() => screen.getByTestId("picker-scroll").props.onMomentumScrollEnd(boundary));
	expect(scrollTo).not.toHaveBeenCalled();
});

test("Harmony ignores momentum events from its own alignment animation", async () => {
	const onChange = await setup();
	await act(() => screen.getByTestId("picker-scroll").props.onMomentumScrollEnd(event(355)));
	expect(scrollTo).toHaveBeenCalledTimes(1);
	expect(onChange).toHaveBeenLastCalledWith(data[7], 7);
	await act(() => screen.getByTestId("picker-scroll").props.onMomentumScrollBegin(event(355)));
	await act(() => screen.getByTestId("picker-scroll").props.onMomentumScrollEnd(event(339)));
	expect(scrollTo).toHaveBeenCalledTimes(1);
	await act(() => screen.getByTestId("picker-scroll").props.onScrollBeginDrag(event(339)));
	await act(() => screen.getByTestId("picker-scroll").props.onScrollEndDrag(event(300)));
	await act(() => jest.advanceTimersByTime(80));
	expect(scrollTo).toHaveBeenCalledTimes(2);
	expect(onChange).toHaveBeenLastCalledWith(data[6], 6);
});
