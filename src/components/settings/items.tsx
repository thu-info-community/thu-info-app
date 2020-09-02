import {
	GestureResponderEvent,
	Platform,
	Switch,
	Text,
	TouchableHighlight,
	TouchableNativeFeedback,
	View,
} from "react-native";
import React, {useState} from "react";

export const SettingsItem = ({
	text,
	onPress,
}: {
	text: string;
	onPress: (event: GestureResponderEvent) => void;
}) => {
	const content = (
		<View style={{padding: 12}}>
			<Text style={{fontSize: 18}}>{text}</Text>
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
