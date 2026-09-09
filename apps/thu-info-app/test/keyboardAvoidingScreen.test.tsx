import React from "react";
import {afterEach, expect, jest, test} from "@jest/globals";
import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react-native";
import {HeaderHeightContext} from "@react-navigation/elements";
import {Keyboard, Platform, StyleSheet, TextInput} from "react-native";
import {KeyboardAvoidingScreen} from "../src/components/keyboardAvoidingScreen";

const originalOS = Platform.OS;
afterEach(async () => {
	await cleanup();
	jest.restoreAllMocks();
	Platform.OS = originalOS;
});

test.each([
	{os: "android", header: 64, offset: undefined, bottom: 300},
	{os: "ios", header: 64, offset: undefined, bottom: 300},
	{os: "android", header: undefined, offset: undefined, bottom: 236},
	{os: "ios", header: undefined, offset: undefined, bottom: 236},
	{os: "android", header: 64, offset: 0, bottom: 236},
	{os: "ios", header: 64, offset: 0, bottom: 236},
] as const)(
	"$os restores layout after keyboard dismissal (header=$header, offset=$offset)",
	async ({os, header, offset, bottom}) => {
		Platform.OS = os;
		const listeners = new Map<string, (event: any) => void>();
		jest.spyOn(Keyboard, "addListener").mockImplementation((name, listener) => {
			listeners.set(name, listener);
			return {remove: () => listeners.delete(name)};
		});
		await render(
			<HeaderHeightContext.Provider value={header}>
				<KeyboardAvoidingScreen keyboardVerticalOffset={offset}>
					<TextInput testID="input" />
				</KeyboardAvoidingScreen>
			</HeaderHeightContext.Provider>,
		);
		const outer = screen.root;
		if (!outer) throw new Error("Keyboard avoidance root was not rendered");
		await fireEvent(outer, "layout", {
			persist: () => {},
			nativeEvent: {layout: {x: 0, y: 0, width: 400, height: 736}},
		});
		for (let cycle = 0; cycle < 2; cycle++) {
			await act(async () => {
				listeners.get(os === "ios" ? "keyboardWillShow" : "keyboardDidShow")!({
					duration: 0,
					endCoordinates: {screenY: 500, height: 300, screenX: 0, width: 400},
				});
			});
			const shown = StyleSheet.flatten(outer.props.style);
			expect(os === "ios" ? shown.paddingBottom : shown.height).toBe(
				os === "ios" ? bottom : 736 - bottom,
			);
			await act(async () => {
				listeners.get(os === "ios" ? "keyboardWillHide" : "keyboardDidHide")!({
					duration: 0,
					endCoordinates: {screenY: 500, height: 0, screenX: 0, width: 400},
				});
			});
			const hidden = StyleSheet.flatten(outer.props.style);
			expect(hidden.flex).toBe(1);
			expect(hidden.height).toBeUndefined();
			if (os === "ios") expect(hidden.paddingBottom).toBe(0);
		}
	},
);
