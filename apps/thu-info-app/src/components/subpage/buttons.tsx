import {
	ActivityIndicator,
	Pressable,
	StyleProp,
	Text,
	useColorScheme,
	ViewStyle,
} from "react-native";
import themes from "../../assets/themes/themes";
import {radius, spacing} from "./tokens";

type ButtonProps = {
	text: string;
	onPress: () => void;
	disabled?: boolean;
	loading?: boolean;
	style?: StyleProp<ViewStyle>;
	accessibilityLabel?: string;
	testID?: string;
	numberOfLines?: number;
};

const AppButton = ({
	text,
	onPress,
	disabled,
	loading,
	style,
	accessibilityLabel,
	testID,
	numberOfLines,
	fill,
}: ButtonProps & {fill: string}) => {
	const {colors} = themes(useColorScheme());
	const inactive = disabled || loading;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel ?? text}
			accessibilityState={{disabled: !!inactive, busy: !!loading}}
			disabled={inactive}
			onPress={onPress}
			testID={testID}
			style={({pressed}) => [
				{
					backgroundColor: inactive ? colors.themeGrey : fill,
					borderRadius: radius.control,
					paddingVertical: spacing.md,
					paddingHorizontal: spacing.xl,
					alignItems: "center",
					justifyContent: "center",
					opacity: pressed ? 0.85 : 1,
				},
				style,
			]}>
			{loading ? (
				<ActivityIndicator color={colors.contentBackground} />
			) : (
				<Text
					numberOfLines={numberOfLines}
					style={{
						color: inactive ? colors.fontB3 : colors.contentBackground,
						fontSize: 18,
						fontWeight: "600",
					}}>
					{text}
				</Text>
			)}
		</Pressable>
	);
};

/** Filled primary action (submit/confirm). */
export const PrimaryButton = (props: ButtonProps) => {
	const {colors} = themes(useColorScheme());
	return <AppButton {...props} fill={colors.primaryLight} />;
};

/** Filled destructive action. */
export const DangerButton = (props: ButtonProps) => {
	const {colors} = themes(useColorScheme());
	return <AppButton {...props} fill={colors.statusError} />;
};

/** Outlined neutral action. */
export const SecondaryButton = ({
	text,
	onPress,
	disabled,
	loading,
	style,
	accessibilityLabel,
	testID,
	numberOfLines,
}: ButtonProps) => {
	const {colors} = themes(useColorScheme());
	const inactive = disabled || loading;
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel ?? text}
			accessibilityState={{disabled: !!inactive, busy: !!loading}}
			disabled={inactive}
			onPress={onPress}
			testID={testID}
			style={({pressed}) => [
				{
					backgroundColor: colors.transparent,
					borderWidth: 1,
					borderColor: colors.inputBorder,
					borderRadius: radius.control,
					paddingVertical: spacing.md,
					paddingHorizontal: spacing.xl,
					alignItems: "center",
					justifyContent: "center",
					opacity: pressed ? 0.7 : 1,
				},
				style,
			]}>
			{loading ? (
				<ActivityIndicator color={colors.text} />
			) : (
				<Text
					numberOfLines={numberOfLines}
					style={{color: colors.text, fontSize: 18, fontWeight: "600"}}>
					{text}
				</Text>
			)}
		</Pressable>
	);
};

export type {ButtonProps as SubPageButtonProps};
