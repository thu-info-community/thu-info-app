import themedStyles from "../../utils/themedStyles";
import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import React, {ReactElement} from "react";
import {store} from "../../redux/store";
import {top5UpdateAction} from "../../redux/actions/top5";
import zh from "../../assets/translations/zh";
import {getStr} from "../../utils/i18n";

export const secondaryItemIconSize = 30;

export const SecondaryItem = ({
	title,
	destKey,
	icon,
	onPress,
}: {
	title: keyof typeof zh;
	destKey: string;
	icon: ReactElement;
	onPress: () => any;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	return (
		<TouchableOpacity
			style={style.SecondaryItemButton}
			onPress={() => {
				onPress();
				store.dispatch(top5UpdateAction(destKey));
			}}>
			<View style={style.SecondaryItemView}>
				{icon}
				<Text style={style.SecondaryItemText}>{getStr(title)}</Text>
			</View>
		</TouchableOpacity>
	);
};

export const SecondaryItemSeparator = () => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	return <View style={style.SecondaryItemSeparator} />;
};

export const styles = themedStyles((theme) => ({
	SecondaryRootView: {
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
	},
	SecondaryContentView: {
		width: 180,
	},
	SecondaryItemButton: {
		marginVertical: 24,
	},
	SecondaryItemView: {
		flexDirection: "row",
		alignItems: "center",
	},
	SecondaryItemText: {
		marginLeft: 24,
		fontSize: 20,
		color: theme.colors.text,
	},
	SecondaryItemSeparator: {
		height: 1,
		backgroundColor: "#666666",
	},
}));
