import React from "react";
import {afterEach, expect, jest, test} from "@jest/globals";
import {
	act,
	cleanup,
	fireEvent,
	render,
	renderHook,
	screen,
} from "@testing-library/react-native";
import {
	BackHandler,
	Dimensions,
	PanResponder,
	PanResponderCallbacks,
	PanResponderGestureState,
	GestureResponderEvent,
	StyleSheet,
	Text,
	TouchableOpacity,
} from "react-native";
import {useResponsive} from "../src/utils/useResponsive";
import {LibraryFloorMap} from "../src/ui/home/libraryMap";
import {InlineFilterPanel} from "../src/components/InlineFilterPanel";
import {BottomPopupTriggerView} from "../src/components/views";
import {ResponsiveImageViewer} from "../src/components/ResponsiveImageViewer";

const mockImageMount = jest.fn();
jest.mock("react-native-image-zoom-viewer", () => {
	const ReactModule = require("react");
	const {View} = require("react-native");
	return ({imageUrls}: {imageUrls: {url: string}[]}) => {
		ReactModule.useEffect(() => {
			mockImageMount();
		}, []);
		return ReactModule.createElement(View, {testID: "zoom-image", imageUrls});
	};
});

jest.mock("../src/redux/store", () => ({
	currState: () => ({config: {language: "zh"}}),
	helper: {},
}));
const originalWindow = Dimensions.get("window");
afterEach(async () => {
	await cleanup();
	Dimensions.set({window: originalWindow});
	jest.useRealTimers();
	jest.restoreAllMocks();
});

test("responsive tiers update across folding and boundary sizes", async () => {
	const hook = await renderHook(useResponsive);
	for (const [width, height, expected] of [
		[599, 800, "compact"],
		[600, 800, "medium"],
		[799, 800, "medium"],
		[800, 619, "medium"],
		[800, 620, "expanded"],
		[360, 800, "compact"],
		[1280, 800, "expanded"],
		[800, 360, "medium"],
	] as const) {
		await act(() => {
			Dimensions.set({window: {...originalWindow, width, height}});
		});
		expect(hook.result.current.formFactor).toBe(expected);
	}
});

test("image viewer refreshes its crop area when only the available height changes", async () => {
	mockImageMount.mockClear();
	await render(
		<ResponsiveImageViewer
			imageUrls={[{url: "https://example.invalid/chart.jpg"}]}
		/>,
	);
	const layout = async (height: number) =>
		fireEvent(screen.getByTestId("responsive-image-viewer"), "layout", {
			nativeEvent: {layout: {width: 400, height, x: 0, y: 0}},
		});
	await layout(600);
	expect(mockImageMount).toHaveBeenCalledTimes(1);
	await layout(600);
	expect(mockImageMount).toHaveBeenCalledTimes(1);
	await layout(300);
	expect(mockImageMount).toHaveBeenCalledTimes(2);
});

test("encoded images give the zoom viewer their decoded dimensions", async () => {
	const url = "data:image/png;base64,layout-test";
	await render(<ResponsiveImageViewer imageUrls={[{url}]} />);
	await fireEvent(screen.getByTestId("responsive-image-viewer"), "layout", {
		nativeEvent: {layout: {width: 400, height: 600, x: 0, y: 0}},
	});
	expect(screen.queryByTestId("zoom-image")).toBeNull();
	await fireEvent(screen.getByTestId("encoded-image-loader"), "load", {
		nativeEvent: {source: {width: 900, height: 500}},
	});
	expect(screen.getByTestId("zoom-image").props.imageUrls).toEqual([{url, width: 900, height: 500}]);
	expect(screen.queryByTestId("encoded-image-loader")).toBeNull();
});

test("map markers follow the actual image when its aspect ratio and container change", async () => {
	await render(
		<LibraryFloorMap
			uri="https://example.invalid/floor.jpg"
			sections={[
				{
					id: 1,
					zhName: "A区",
					enName: "A",
					zhNameTrace: "A区",
					enNameTrace: "A",
					valid: true,
					total: 10,
					available: 5,
					posX: 25,
					posY: 60,
				},
			]}
		/>,
	);
	await fireEvent(screen.getByTestId("library-map-container"), "layout", {
		nativeEvent: {layout: {width: 800, height: 300, x: 0, y: 0}},
	});
	await fireEvent(screen.getByTestId("library-map-image"), "load", {
		nativeEvent: {source: {width: 1600, height: 900}},
	});
	let frame = StyleSheet.flatten(
		screen.getByTestId("library-map-image-frame").props.style,
	);
	// Height-constrained landscape fits the image instead of using the full window width.
	expect(frame.width).toBeCloseTo((300 * 16) / 9);
	await fireEvent(screen.getByTestId("library-map-container"), "layout", {
		nativeEvent: {layout: {width: 360, height: 700, x: 0, y: 0}},
	});
	frame = StyleSheet.flatten(
		screen.getByTestId("library-map-image-frame").props.style,
	);
	expect(frame.width).toBe(360);
	expect(
		StyleSheet.flatten(screen.getByText("A区").parent!.props.style),
	).toMatchObject({left: "25%", top: "60%"});
	await fireEvent(screen.getByTestId("library-map-image"), "load", {
		nativeEvent: {source: {width: 1000, height: 1000}},
	});
	expect(
		StyleSheet.flatten(
			screen.getByTestId("library-map-image-frame").props.style,
		).aspectRatio,
	).toBe(1);
});

test("inline filters retain selection and consume Back only while open", async () => {
	let back: Parameters<typeof BackHandler.addEventListener>[1] | undefined;
	const remove = jest.fn();
	jest
		.spyOn(BackHandler, "addEventListener")
		.mockImplementation((_event, handler) => {
			back = handler;
			return {remove};
		});
	const select = jest.fn(),
		close = jest.fn();
	const panel = (visible: boolean) => (
		<InlineFilterPanel visible={visible} onClose={close}>
			<TouchableOpacity onPress={select}>
				<Text>选项</Text>
			</TouchableOpacity>
		</InlineFilterPanel>
	);
	const view = await render(panel(true));
	await fireEvent.press(screen.getByText("选项"));
	expect(select).toHaveBeenCalledTimes(1);
	expect(back?.({} as Parameters<NonNullable<typeof back>>[0])).toBe(true);
	expect(close).toHaveBeenCalledTimes(1);
	await view.rerender(panel(false));
	expect(remove).toHaveBeenCalledTimes(1);
	expect(screen.queryByText("选项")).toBeNull();
});

test("bottom popup can drag to cancel after opening and resizing", async () => {
	jest.useFakeTimers();
	let gesture: PanResponderCallbacks | undefined;
	const createPanResponder = PanResponder.create;
	jest.spyOn(PanResponder, "create").mockImplementation((config) => {
		gesture ??= config;
		return createPanResponder(config);
	});
	const cancel = jest.fn(),
		done = jest.fn();
	await render(
		<BottomPopupTriggerView
			testID="open-popup"
			popupTitle="周次"
			popupCancelable
			popupCanFulfill
			popupOnCancelled={cancel}
			popupOnFulfilled={done}
			popupContent={<Text>内容</Text>}>
			<Text>打开</Text>
		</BottomPopupTriggerView>,
	);
	await fireEvent.press(screen.getByTestId("open-popup"));
	await fireEvent(screen.getByTestId("bottom-popup-viewport"), "layout", {
		nativeEvent: {layout: {width: 800, height: 800}},
	});
	await act(() => jest.advanceTimersByTime(300));
	await fireEvent(screen.getByTestId("bottom-popup-viewport"), "layout", {
		nativeEvent: {layout: {width: 360, height: 400}},
	});
	const event = {} as GestureResponderEvent;
	const movement = {dy: 220, dx: 0, vy: 0} as PanResponderGestureState;
	expect(gesture?.onMoveShouldSetPanResponder?.(event, movement)).toBe(true);
	await act(() => gesture?.onPanResponderGrant?.(event, movement));
	await act(() => gesture?.onPanResponderMove?.(event, movement));
	await act(() => gesture?.onPanResponderRelease?.(event, movement));
	await act(() => jest.advanceTimersByTime(400));
	expect(cancel).toHaveBeenCalledTimes(1);
	expect(done).not.toHaveBeenCalled();
});
