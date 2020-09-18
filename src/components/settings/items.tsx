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
	icon,
}: {
	text: string;
	onPress: (event: GestureResponderEvent) => void;
	icon: any;
}) => {
	const content = (
		<View
			style={{
				padding: 8,
				paddingRight: 16,
				flexDirection: "row",
				justifyContent: "space-between",
			}}>
			<View style={{flexDirection: "row", alignItems: "center"}}>
				{icon}
				<Text style={{fontSize: 17, marginHorizontal: 10}}>{text}</Text>
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
	iconOn: any;
	iconOff: any;
}) => {
	const [status, setStatus] = useState(defaultValue);
	return (
		<View
			style={{
				padding: 8,
				flexDirection: "row",
				justifyContent: "space-between",
			}}>
			<View style={{flexDirection: "row", alignItems: "center"}}>
				{status ? iconOn : iconOff}
				<Text style={{fontSize: 17, marginHorizontal: 10}}>
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
				padding: 8,
				paddingRight: 16,
				flexDirection: "row",
				justifyContent: "space-between",
				alignItems: "center",
			}}>
			<Text style={{fontSize: 17, flex: 4}}>{text}</Text>
			<TextInput
				style={{
					fontSize: 15,
					flex: 1,
					backgroundColor: "white",
					textAlign: "left",
					borderColor: "lightgrey",
					borderWidth: 1,
					borderRadius: 5,
					padding: 6,
				}}
				value={String(value)}
				onChangeText={(newText) => onValueChange(Number(newText))}
				keyboardType="numeric"
			/>
		</View>
	);
};

export const SettingsSeparator = () => <View style={{height: 10}} />;
