import React, {ReactElement} from "react";
import {
	Dimensions,
	GestureResponderEvent,
	Text,
	TouchableOpacity,
} from "react-native";
import zh from "../../assets/translations/zh";
import {getStr} from "../../utils/i18n";
import {useColorScheme} from "react-native";
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
	const theme = themes(themeName);

	const width = Dimensions.get("window").width / 5;

	return (
		<TouchableOpacity
			style={{alignItems: "center", marginVertical: 8, width}}
			onPress={onPress}>
			{children}
			<Text
				style={{marginVertical: 4, color: theme.colors.text}}
				ellipsizeMode="tail"
				numberOfLines={1}>
				{getStr(title)}
			</Text>
		</TouchableOpacity>
	);
};
