import React from "react";
import {afterEach, expect, test} from "@jest/globals";
import {cleanup, render, screen} from "@testing-library/react-native";
import {Dimensions, Text} from "react-native";
import {
	AdaptiveLabelValueRow,
	AdaptiveRow,
} from "../src/components/adaptive/rows";
import {AdaptiveBadge} from "../src/components/adaptive/badge";
import {SettingsItem} from "../src/components/settings/items";

const originalWindow = Dimensions.get("window");
afterEach(async () => {
	await cleanup();
	Dimensions.set({window: originalWindow});
});

// Guards the large-font pass invariant: a label carrying essential information
// must not be clamped to a single line, or a large system font truncates it away.
test("SettingsItem's label wraps instead of clamping to one line", async () => {
	await render(
		<SettingsItem
			text="一个很长很长很长的设置项名称"
			onPress={() => {}}
			icon={undefined}
		/>,
	);
	const label = screen.getByText("一个很长很长很长的设置项名称");
	expect(label.props.numberOfLines).toBeUndefined();
});

test("AdaptiveRow keeps its trailing control reachable", async () => {
	await render(
		<AdaptiveRow testID="row" leading={<Text>L</Text>} trailing={<Text>T</Text>}>
			<Text>middle</Text>
		</AdaptiveRow>,
	);
	expect(screen.getByText("middle")).toBeTruthy();
	expect(screen.getByText("T")).toBeTruthy();
});

test("AdaptiveLabelValueRow leaves its essential value unclamped", async () => {
	await render(<AdaptiveLabelValueRow label="学期" value="2023 - 2024 秋季" />);
	expect(
		screen.getByText("2023 - 2024 秋季").props.numberOfLines,
	).toBeUndefined();
});

test("AdaptiveBadge renders a plain dot under a large system font", async () => {
	Dimensions.set({window: {...originalWindow, fontScale: 2}});
	await render(<AdaptiveBadge color="#f00" testID="badge" />);
	expect(screen.getByTestId("badge")).toBeTruthy();
});
