import themedStyles from "../../utils/themedStyles";
import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import {ReactElement} from "react";
import {useDispatch} from "react-redux";
import {top5Update} from "../../redux/slices/top5";
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
	const dispatch = useDispatch();
	return (
		<TouchableOpacity
			style={style.SecondaryItemButton}
			onPress={() => {
				onPress();
				dispatch(top5Update(destKey));
			}}>
			<RoundedView style={style.SecondaryItemView}>
				<View style={{width: "60%", aspectRatio: 1}}>{icon}</View>
				<Text style={style.SecondaryItemText}>{getStr(title)}</Text>
			</RoundedView>
		</TouchableOpacity>
	);
};

export const styles = themedStyles((theme) => ({
	SecondaryRootView: {
		alignItems: "center",
		justifyContent: "center",
		flexGrow: 1,
		padding: 8,
	},
	SecondaryContentView: {
		width: "100%",
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		flexWrap: "wrap",
	},
	SecondaryItemButton: {
		width: "50%",
		maxWidth: 188,
		padding: 4,
	},
	SecondaryItemView: {
		width: "100%",
		minHeight: 160,
		borderRadius: 20,
		alignItems: "center",
		justifyContent: "center",
		padding: 16,
	},
	SecondaryItemText: {
		textAlign: "center",
		marginTop: 8,
		fontSize: 16,
		color: theme.colors.fontB2,
	},
	SecondaryItemSeparator: {
		height: 1,
		backgroundColor: theme.colors.fontB2,
	},
}));
