import themedStyles from "../../utils/themedStyles";
import {
	Dimensions,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import React, {ReactElement} from "react";
import {store} from "../../redux/store";
import {top5UpdateAction} from "../../redux/actions/top5";
import zh from "../../assets/translations/zh";
import {getStr} from "../../utils/i18n";
import {RoundedView} from "../views";

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
	const windowWidth = Dimensions.get("window").width;
	const viewSize = (windowWidth - 32) / 2;
	return (
		<TouchableOpacity
			style={style.SecondaryItemButton}
			onPress={() => {
				onPress();
				store.dispatch(top5UpdateAction(destKey));
			}}>
			<RoundedView
				style={[style.SecondaryItemView, {width: viewSize, height: viewSize}]}>
				<View style={{width: "60%", height: "60%"}}>{icon}</View>
				<Text style={style.SecondaryItemText}>{getStr(title)}</Text>
			</RoundedView>
		</TouchableOpacity>
	);
};

export const styles = themedStyles((theme) => ({
	SecondaryRootView: {
		alignItems: "center",
		justifyContent: "center",
		flex: 1,
		padding: 8,
	},
	SecondaryContentView: {
		alignItems: "center",
		flexDirection: "row",
		flexWrap: "wrap",
	},
	SecondaryItemButton: {
		margin: 4,
	},
	SecondaryItemView: {
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 32,
	},
	SecondaryItemText: {
		marginTop: 8,
		fontSize: 16,
		color: theme.colors.fontB2,
	},
	SecondaryItemSeparator: {
		height: 1,
		backgroundColor: theme.colors.fontB2,
	},
}));
