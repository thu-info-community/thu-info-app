import React, {useState} from "react";
import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import {RoundedView} from "../../components/views";
import IconCheck from "../../assets/icons/IconCheck";
import {RootNav, SportsSelectTitleProp} from "../../components/Root";
import {styles} from "../settings/settings";
import {
	VALID_RECEIPT_TITLES,
	ValidReceiptTypes,
} from "thu-info-lib/dist/lib/sports";
import {getStr} from "../../utils/i18n";

export const SportsSelectTitleScreen = ({
	route: {params},
	navigation,
}: {
	route: SportsSelectTitleProp;
	navigation: RootNav;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);

	const [titleSelected, setTitleSelected] = useState<
		ValidReceiptTypes | undefined
	>(params.receiptTitle);

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				{[...VALID_RECEIPT_TITLES, undefined].map((title, index) => (
					<View key={title ?? "DEFAULT"}>
						{index > 0 && <View style={style.separator} />}
						<TouchableOpacity
							style={style.touchable}
							onPress={() => {
								setTitleSelected(title);
								navigation.navigate("SportsSelect", {
									...params,
									receiptTitle: title,
								});
							}}>
							<Text style={style.text}>
								{title ?? getStr("noReceiptTitle")}
							</Text>
							{title === titleSelected && <IconCheck width={18} height={18} />}
						</TouchableOpacity>
					</View>
				))}
			</RoundedView>
		</View>
	);
};
