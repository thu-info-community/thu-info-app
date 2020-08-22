import React from "react";
import {GestureResponderEvent, Text, TouchableOpacity} from "react-native";
import zh from "../../assets/translations/zh";
import {getStr} from "../../utils/i18n";

export const HomeIcon = ({
	title,
	onPress,
	children,
}: {
	title: keyof typeof zh;
	onPress: (event: GestureResponderEvent) => void;
	children: JSX.Element;
}) => (
	<TouchableOpacity style={{alignItems: "center", margin: 8}} onPress={onPress}>
		{children}
		<Text>{getStr(title)}</Text>
	</TouchableOpacity>
);
