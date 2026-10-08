import {ReactNode} from "react";
import {
	ScrollView,
	StyleProp,
	Text,
	useColorScheme,
	View,
	ViewStyle,
} from "react-native";
import themes from "../../assets/themes/themes";
import {KeyboardAvoidingScreen} from "../keyboardAvoidingScreen";
import {RoundedView} from "../views";
import {layout, spacing} from "./tokens";

/**
 * Root container for a sub-page. Gives every sub-page the same screen padding,
 * the same centered wide-screen max width (matching the settings root), and an
 * optional keyboard-avoiding wrapper, instead of each screen re-declaring its
 * own outer `View`/`ScrollView` with drifting padding.
 */
export const SubPageScreen = ({
	children,
	scroll = true,
	keyboard = false,
	contentStyle,
	maxWidth = layout.maxContentWidth,
}: {
	children: ReactNode;
	scroll?: boolean;
	keyboard?: boolean;
	contentStyle?: StyleProp<ViewStyle>;
	maxWidth?: number;
}) => {
	const {colors} = themes(useColorScheme());
	const content = (
		<View
			style={[
				{
					flexGrow: 1,
					width: "100%",
					maxWidth,
					alignSelf: "center",
					padding: layout.screenPadding,
				},
				contentStyle,
			]}>
			{children}
		</View>
	);
	const body = scroll ? (
		<ScrollView
			style={{flex: 1, backgroundColor: colors.themeBackground}}
			keyboardShouldPersistTaps="handled"
			contentContainerStyle={{flexGrow: 1}}>
			{content}
		</ScrollView>
	) : (
		<View style={{flex: 1, backgroundColor: colors.themeBackground}}>
			{content}
		</View>
	);
	return keyboard ? (
		<KeyboardAvoidingScreen style={{backgroundColor: colors.themeBackground}}>
			{body}
		</KeyboardAvoidingScreen>
	) : (
		body
	);
};

/**
 * A titled content card (`RoundedView` + padding + optional heading). Replaces
 * the many hand-built "group card with a heading" blocks.
 */
export const SectionCard = ({
	title,
	children,
	style,
}: {
	title?: string;
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
}) => {
	const {colors} = themes(useColorScheme());
	return (
		<RoundedView
			style={[{padding: spacing.lg, marginBottom: layout.sectionGap}, style]}>
			{title ? (
				<Text
					style={{
						color: colors.text,
						fontSize: 18,
						fontWeight: "600",
						marginBottom: spacing.sm,
					}}>
					{title}
				</Text>
			) : null}
			{children}
		</RoundedView>
	);
};
