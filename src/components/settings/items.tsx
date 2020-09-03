import {
	GestureResponderEvent,
	Platform,
	Switch,
	Text,
	TextInput,
	TouchableHighlight,
	TouchableNativeFeedback,
	View,
} from "react-native";
import React, {useState} from "react";
import Icon from "react-native-vector-icons/FontAwesome";

export const SettingsItem = ({
	text,
	onPress,
}: {
	text: string;
	onPress: (event: GestureResponderEvent) => void;
}) => {
	const content = (
		<View
			style={{
				padding: 12,
				paddingRight: 16,
				flexDirection: "row",
				justifyContent: "space-between",
			}}>
			<Text style={{fontSize: 18}}>{text}</Text>
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
}: {
	textOn: string;
	textOff: string;
	onValueChange: (state: boolean) => void;
	defaultValue: boolean;
}) => {
	const [status, setStatus] = useState(defaultValue);
	return (
		<View
			style={{
				padding: 12,
				flexDirection: "row",
				justifyContent: "space-between",
			}}>
			<Text style={{fontSize: 18}}>{status ? textOn : textOff}</Text>
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

export const SettingsEditValue = ({
	text,
	value,
	onValueChange,
}: {
	text: string;
	value: number;
	onValueChange: (newValue: number) => void;
}) => {
	return (
		<View
			style={{
				padding: 12,
				paddingRight: 16,
				flexDirection: "row",
				justifyContent: "space-between",
			}}>
			<Text style={{fontSize: 18, flex: 4}}>{text}</Text>
			<TextInput
				style={{flex: 1}}
				value={String(value)}
				onChangeText={(newText) => onValueChange(Number(newText))}
				keyboardType="numeric"
			/>
		</View>
	);
};

export const SettingsSeparator = () => <View style={{height: 10}} />;
