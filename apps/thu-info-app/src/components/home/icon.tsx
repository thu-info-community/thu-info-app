import {ReactElement} from "react";
import {GestureResponderEvent, Text, TouchableOpacity} from "react-native";
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

	return (
		<TouchableOpacity
			style={{
				marginTop: 12,
				alignItems: "center",
				flexGrow: 0,
				flexShrink: 0,
				flexBasis: "20%",
			}}
			onPress={onPress}>
			{children}
			<Text
				style={{color: theme.colors.text, marginTop: 8}}
				ellipsizeMode="tail"
				numberOfLines={1}>
				{getStr(title)}
			</Text>
		</TouchableOpacity>
	);
};
