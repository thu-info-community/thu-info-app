import {ReactNode} from "react";
import {
	ActivityIndicator,
	StyleProp,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
	ViewStyle,
} from "react-native";
import themes from "../../assets/themes/themes";
import IconRight from "../../assets/icons/IconRight";
import {getStr} from "../../utils/i18n";
import {styles as sharedStyles} from "./screenStyles";
import {separatorStyle, spacing} from "./tokens";

/**
 * A navigable settings-style row: label on the left, optional value/action on
 * the right, ending with the standard chevron. Matches the settings-section-list
 * look so leaf sub-pages and settings sub-pages read the same.
 */
export const SettingRow = ({
	text,
	onPress,
	rightText,
	right,
	showChevron = true,
	disabled,
	style,
}: {
	text: string;
	onPress?: () => void;
	rightText?: string;
	right?: ReactNode;
	showChevron?: boolean;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
}) => {
	const themeName = useColorScheme();
	const style_ = sharedStyles(themeName);
	return (
		<TouchableOpacity
			style={[style_.touchable, style]}
			onPress={onPress}
			disabled={disabled}
			accessibilityRole={onPress ? "button" : undefined}>
			<Text style={style_.text}>{text}</Text>
			<View style={{flexDirection: "row", alignItems: "center"}}>
				{rightText ? <Text style={style_.version}>{rightText}</Text> : null}
				{right}
				{showChevron ? <IconRight height={20} width={20} /> : null}
			</View>
		</TouchableOpacity>
	);
};

/** Hairline separator between rows inside a card. */
export const Separator = ({style}: {style?: StyleProp<ViewStyle>}) => {
	const {colors} = themes(useColorScheme());
	return (
		<View
			style={[
				separatorStyle(colors),
				{marginVertical: spacing.md, marginHorizontal: spacing.lg},
				style,
			]}
		/>
	);
};

/** A read-only label/value field. */
export const DetailRow = ({
	label,
	value,
	selectable,
}: {
	label?: string;
	value: string;
	selectable?: boolean;
}) => {
	const {colors} = themes(useColorScheme());
	return (
		<View style={{paddingVertical: 6}}>
			{label ? (
				<Text style={{color: colors.fontB2, fontSize: 14, marginBottom: 3}}>
					{label}
				</Text>
			) : null}
			<Text selectable={selectable} style={{color: colors.text, fontSize: 16}}>
				{value || "—"}
			</Text>
		</View>
	);
};

/** Standard loading block. */
export const LoadingState = ({label = getStr("loading")}: {label?: string}) => {
	const {colors} = themes(useColorScheme());
	return (
		<View
			accessibilityLabel={label}
			style={{padding: 20, alignItems: "center"}}>
			<ActivityIndicator color={colors.primary} />
			<Text style={{color: colors.fontB2, marginTop: 8}}>{label}</Text>
		</View>
	);
};

/** Standard error block with a retry action. */
export const ErrorState = ({
	onRetry,
	message = getStr("idLoadFailed"),
	retryLabel = getStr("idRetry"),
}: {
	onRetry: () => void;
	message?: string;
	retryLabel?: string;
}) => {
	const {colors} = themes(useColorScheme());
	return (
		<View style={{padding: 16, alignItems: "center", gap: 8}}>
			<Text style={{color: colors.text, textAlign: "center"}}>{message}</Text>
			<TouchableOpacity
				accessibilityRole="button"
				onPress={onRetry}
				style={{padding: 8}}>
				<Text style={{color: colors.primary, fontSize: 16}}>{retryLabel}</Text>
			</TouchableOpacity>
		</View>
	);
};

/** Composed empty state for screens with nothing to show yet. */
export const EmptyState = ({
	title,
	hint,
}: {
	title: string;
	hint?: string;
}) => {
	const {colors} = themes(useColorScheme());
	return (
		<View style={{padding: 24, alignItems: "center", gap: 6}}>
			<Text style={{color: colors.text, fontSize: 16, textAlign: "center"}}>
				{title}
			</Text>
			{hint ? (
				<Text
					style={{color: colors.fontB3, fontSize: 13, textAlign: "center"}}>
					{hint}
				</Text>
			) : null}
		</View>
	);
};
