import React, {ReactElement} from "react";
import {GestureResponderEvent, Text, TouchableOpacity} from "react-native";
import zh from "../../assets/translations/zh";
import {getStr} from "../../utils/i18n";
import {useColorScheme} from "react-native-appearance";
import themes from "../../assets/themes/themes";

export const HomeIcon = ({
	title,
	onPress,
	children,
}: {
	title: keyof typeof zh;
	onPress: (event: GestureResponderEvent) => void;
	children: ReactElement;
}) => {
	const themeName = useColorScheme();
	const theme = themes[themeName];

	return (
		<TouchableOpacity
			style={{alignItems: "center", margin: 8, marginHorizontal: 14}}
			onPress={onPress}>
			{children}
			<Text style={{marginVertical: 4, color: theme.colors.text}}>
				{getStr(title)}
			</Text>
		</TouchableOpacity>
	);
};
