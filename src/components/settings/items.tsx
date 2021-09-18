import {
	Button,
	GestureResponderEvent,
	Platform,
	Switch,
	Text,
	TextInput,
	TouchableHighlight,
	TouchableNativeFeedback,
	View,
} from "react-native";
import React, {cloneElement, ReactElement, useState} from "react";
import Icon from "react-native-vector-icons/FontAwesome";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {NetworkRetry} from "../easySnackbars";
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
}: {
	text: string;
	onPress: (event: GestureResponderEvent) => void;
	icon: ReactElement | undefined;
	badge?: string;
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
				<Text style={{fontSize: 17, marginHorizontal: 10, color: colors.text}}>
					{text}
					{badge && <Text style={{color: "red", fontSize: 12}}>[{badge}]</Text>}
				</Text>
			</View>
			<Icon name="angle-right" size={24} color="lightgrey" />
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

export const SettingsSwitch = ({
	textOn,
	textOff,
	onValueChange,
	defaultValue,
	iconOn,
	iconOff,
}: {
	textOn: string;
	textOff: string;
	onValueChange: (state: boolean) => void;
	defaultValue: boolean;
	iconOn: ReactElement | undefined;
	iconOff: ReactElement | undefined;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const [status, setStatus] = useState(defaultValue);
	return (
		<View
			style={{
				padding: 8,
				flexDirection: "row",
				justifyContent: "space-between",
			}}>
			<View style={{flexDirection: "row", alignItems: "center"}}>
				{setIconWidth(status ? iconOn : iconOff, colors)}
				<Text style={{fontSize: 17, marginHorizontal: 10, color: colors.text}}>
					{status ? textOn : textOff}
				</Text>
			</View>
			<Switch
				value={status}
				onValueChange={(value) => {
					setStatus(value);
					onValueChange(value);
				}}
			/>
		</View>
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
					backgroundColor: colors.background,
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
					backgroundColor: colors.background,
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

export const SettingsSetPassword = ({
	text,
	onValueChange,
	validator,
}: {
	text: string;
	onValueChange: (newValue: string) => void;
	validator: (password: string) => Promise<boolean>;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const [value, setValue] = useState("");
	const [disabled, setDisabled] = useState(false);
	return (
		<View
			style={{
				padding: 8,
				paddingRight: 16,
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center",
			}}>
			<Text style={{fontSize: 17, flex: 2, color: colors.text}}>{text}</Text>
			<TextInput
				style={{
					fontSize: 15,
					flex: 2,
					backgroundColor: colors.background,
					color: colors.text,
					textAlign: "left",
					borderColor: "lightgrey",
					borderWidth: 1,
					borderRadius: 5,
					padding: 6,
				}}
				placeholder={getStr("hidden")}
				value={value}
				onChangeText={(newText) => {
					setValue(newText);
					onValueChange(newText);
				}}
				secureTextEntry
			/>
			<Button
				title={getStr("validate")}
				disabled={disabled}
				onPress={() => {
					setDisabled(true);
					validator(value)
						.then((result) => {
							Snackbar.show({
								text: getStr(result ? "validateSucceed" : "validateFail"),
								duration: Snackbar.LENGTH_SHORT,
							});
						})
						.catch(NetworkRetry)
						.then(() => setDisabled(false));
				}}
			/>
		</View>
	);
};

export const SettingsSeparator = () => <View style={{height: 10}} />;
