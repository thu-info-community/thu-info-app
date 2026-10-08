import {ReactNode} from "react";
import {
	StyleProp,
	Text,
	TextInput,
	TextInputProps,
	useColorScheme,
	View,
	ViewStyle,
} from "react-native";
import themes from "../../assets/themes/themes";
import {spacing} from "./tokens";

/**
 * A labelled form field. Wraps the label/input/help/error stack that action
 * screens currently hand-roll per field.
 */
export const FormRow = ({
	label,
	caption,
	error,
	children,
	style,
}: {
	label?: string;
	caption?: string;
	error?: string;
	children: ReactNode;
	style?: StyleProp<ViewStyle>;
}) => {
	const {colors} = themes(useColorScheme());
	return (
		<View style={[{marginBottom: spacing.lg}, style]}>
			{label ? (
				<Text style={{color: colors.text, fontSize: 16, marginBottom: spacing.sm}}>
					{label}
				</Text>
			) : null}
			{children}
			{caption ? (
				<Text style={{color: colors.fontB3, fontSize: 13, marginTop: spacing.xs}}>
					{caption}
				</Text>
			) : null}
			{error ? (
				<Text
					style={{
						color: colors.statusError,
						fontSize: 13,
						marginTop: spacing.xs,
					}}>
					{error}
				</Text>
			) : null}
		</View>
	);
};

/** Themed `TextInput` (text/placeholder colors from the active theme). */
export const ThemedTextInput = ({style, ...props}: TextInputProps) => {
	const {colors} = themes(useColorScheme());
	return (
		<TextInput
			placeholderTextColor={colors.fontB3}
			style={[{color: colors.text, fontSize: 16}, style]}
			{...props}
		/>
	);
};
