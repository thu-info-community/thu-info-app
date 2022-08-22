import {
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import React from "react";
import {sportsIdInfoList} from "thu-info-lib/dist/lib/sports";
import themes from "../../assets/themes/themes";
import {RootNav} from "../../components/Root";
import {RoundedView} from "../../components/views";
import IconRight from "../../assets/icons/IconRight";

export const SportsScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<ScrollView style={{flex: 1}}>
			<RoundedView
				style={{marginHorizontal: 12, marginVertical: 24, padding: 16}}>
				{sportsIdInfoList.map((info, index) => (
					<View key={info.name}>
						{index > 0 && (
							<View
								style={{
									height: 0.5,
									backgroundColor: colors.themeGrey,
									marginVertical: 12,
								}}
							/>
						)}
						<TouchableOpacity
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
							}}
							onPress={() => {
								navigation.navigate("SportsDetail", {info});
							}}>
							<Text
								style={{
									color: colors.text,
									fontSize: 16,
									lineHeight: 24,
								}}>
								{info.name}
							</Text>
							<IconRight height={24} width={24} />
						</TouchableOpacity>
					</View>
				))}
			</RoundedView>
		</ScrollView>
	);
};
