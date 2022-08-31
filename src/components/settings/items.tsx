import {
	GestureResponderEvent,
	Platform,
	Text,
	TextInput,
	TouchableHighlight,
	TouchableNativeFeedback,
	TouchableOpacity,
	View,
} from "react-native";
import React, {cloneElement, ReactElement} from "react";
import IconRight from "../../assets/icons/IconRight";
import {useColorScheme} from "react-native";
import themes, {ColorTheme} from "../../assets/themes/themes";

const setIconWidth = (icon: ReactElement | undefined, colors: ColorTheme) =>
	icon === undefined
		? undefined
		: cloneElement(icon, {style: {width: 20, color: colors.text}});

export const SettingsItem = ({
	text,
	onPress,
	icon,
	badge,
	normalText,
}: {
	text: string;
	onPress: (event: GestureResponderEvent) => void;
	icon: ReactElement | undefined;
	badge?: string;
	normalText?: boolean;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const content = (
		<View
			style={{
				padding: 8,
				paddingRight: 16,
				flexDirection: "row",
				justifyContent: "space-between",
			}}>
			<View style={{flexDirection: "row", alignItems: "center"}}>
				{setIconWidth(icon, colors)}
				<Text
					style={
						normalText
							? {color: colors.text}
							: {fontSize: 17, marginHorizontal: 10, color: colors.text}
					}
					numberOfLines={1}>
					{text}
					{badge && <Text style={{color: "red", fontSize: 12}}>[{badge}]</Text>}
				</Text>
			</View>
			<IconRight height={24} width={24} />
		</View>
	);
	return Platform.OS === "ios" ? (
		<TouchableHighlight underlayColor="#0002" onPress={onPress}>
			{content}
		</TouchableHighlight>
	) : (
		<TouchableNativeFeedback
			background={TouchableNativeFeedback.Ripple("#0002", false)}
			onPress={onPress}>
			{content}
		</TouchableNativeFeedback>
	);
};

export const SettingsMiddleText = ({
	text,
	onPress,
}: {
	text: string;
	onPress: (event: GestureResponderEvent) => void;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const content = (
		<View
			style={{
				padding: 8,
				alignItems: "center",
			}}>
			<Text style={{color: colors.text}}>{text}</Text>
		</View>
	);
	return Platform.OS === "ios" ? (
		<TouchableHighlight underlayColor="#0002" onPress={onPress}>
			{content}
		</TouchableHighlight>
	) : (
		<TouchableNativeFeedback
			background={TouchableNativeFeedback.Ripple("#0002", false)}
			onPress={onPress}>
			{content}
		</TouchableNativeFeedback>
	);
};

export const SettingsLargeButton = ({
	text,
	onPress,
	disabled,
	redText,
}: {
	text: string;
	onPress: (event: GestureResponderEvent) => void;
	disabled: boolean;
	redText: boolean;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<TouchableOpacity
			style={{
				backgroundColor:
					themeName === "dark"
						? disabled
							? "#FFF4"
							: "#ccc4"
						: disabled
						? "#0000"
						: "#0002",
				marginHorizontal: 20,
				borderRadius: 4,
				justifyContent: "center",
			}}
			disabled={disabled}
			onPress={(e) => !disabled && onPress(e)}>
			<Text
				style={{
					textAlign: "center",
					padding: 12,
					fontSize: 20,
					color: redText ? "red" : colors.text,
				}}>
				{text}
			</Text>
		</TouchableOpacity>
	);
};

export const SettingsEditValue = <T extends string | number>({
	text,
	value,
	onValueChange,
}: {
	text: string;
	value: T;
	onValueChange: (newValue: T) => void;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<View
			style={{
				padding: 8,
				paddingRight: 16,
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center",
			}}>
			<Text style={{fontSize: 17, flex: 4, color: colors.text}}>{text}</Text>
			<TextInput
				style={{
					fontSize: 15,
					flex: 1,
					backgroundColor: colors.themeBackground,
					color: colors.text,
					textAlign: "left",
					borderColor: "lightgrey",
					borderWidth: 1,
					borderRadius: 5,
					padding: 6,
				}}
				value={String(value)}
				onChangeText={(newText) => {
					if (typeof value === "string") {
						// @ts-ignore
						onValueChange(newText);
					} else if (!isNaN(Number(newText))) {
						// @ts-ignore
						onValueChange(Number(newText));
					}
				}}
				keyboardType={typeof value === "string" ? "default" : "numeric"}
			/>
		</View>
	);
};

export const SettingsEditText = ({
	text,
	value,
	onValueChange,
	placeholder,
	enabled,
}: {
	text: string;
	value: string;
	onValueChange: (newValue: string) => void;
	placeholder: string;
	enabled: boolean;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	return (
		<View
			style={{
				padding: 8,
				paddingRight: 16,
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center",
			}}>
			<Text style={{fontSize: 17, flex: 1, color: colors.text}}>{text}</Text>
			<TextInput
				style={{
					fontSize: 15,
					flex: 2,
					backgroundColor: colors.themeBackground,
					color: colors.text,
					textAlign: "left",
					borderColor: "lightgrey",
					borderWidth: 1,
					borderRadius: 5,
					padding: 6,
				}}
				placeholder={placeholder}
				value={value}
				onChangeText={onValueChange}
				editable={enabled}
			/>
		</View>
	);
};

export const SettingsSeparator = () => <View style={{height: 10}} />;
