import {Children, type PropsWithChildren} from "react";
import {
	ActivityIndicator,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {RoundedView} from "../views";

export const IdSection = ({
	title,
	children,
}: PropsWithChildren<{title?: string}>) => {
	const {colors} = themes(useColorScheme());
	return (
		<RoundedView style={{padding: 16, marginBottom: 12}}>
			{title && (
				<Text
					style={{
						color: colors.text,
						fontSize: 18,
						fontWeight: "600",
						marginBottom: 8,
					}}>
					{title}
				</Text>
			)}
			{children}
		</RoundedView>
	);
};

export const IdField = ({label, value}: {label?: string; value: string}) => {
	const {colors} = themes(useColorScheme());
	return (
		<View style={{paddingVertical: 6}}>
			{label && (
				<Text style={{color: colors.fontB2, fontSize: 14, marginBottom: 3}}>
					{label}
				</Text>
			)}
			<Text selectable style={{color: colors.text, fontSize: 16}}>
				{value || "—"}
			</Text>
		</View>
	);
};

export const IdFieldRow = ({
	children,
	columnWeights,
}: PropsWithChildren<{columnWeights?: number[]}>) => (
	<View style={{flexDirection: "row", gap: 16}}>
		{Children.map(children, (child, index) => (
			<View style={{flex: columnWeights?.[index] ?? 1, minWidth: 0}}>
				{child}
			</View>
		))}
	</View>
);

export const IdLoading = () => {
	const {colors} = themes(useColorScheme());
	return (
		<View
			accessibilityLabel={getStr("loading")}
			style={{padding: 20, alignItems: "center"}}>
			<ActivityIndicator color={colors.primary} />
			<Text style={{color: colors.fontB2, marginTop: 8}}>
				{getStr("loading")}
			</Text>
		</View>
	);
};

export const IdLoadError = ({
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
