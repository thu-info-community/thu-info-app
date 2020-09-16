import React, {ReactElement} from "react";
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
	children: ReactElement;
}) => (
	<TouchableOpacity
		style={{alignItems: "center", margin: 8, marginHorizontal: 14}}
		onPress={onPress}>
		{children}
		<Text style={{marginVertical: 4}}>{getStr(title)}</Text>
	</TouchableOpacity>
);
