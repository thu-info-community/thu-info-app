import React from "react";
import {RootNav} from "../../components/Root";
import {useColorScheme, View} from "react-native";
import {SecondaryItem, styles} from "../../components/home/secondaryItems";
import IconWasher from "../../assets/icons/IconWasher";
import IconWater from "../../assets/icons/IconWater";
import IconDormScore from "../../assets/icons/IconDormScore";
import IconEleRecharge from "../../assets/icons/IconEleRecharge";

export const DormScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	return (
		<View style={style.SecondaryRootView}>
			<View style={style.SecondaryContentView}>
				<SecondaryItem
					title="washer"
					destKey="washer"
					icon={<IconWasher />}
					onPress={() => {
						navigation.navigate("WasherWeb");
					}}
				/>
				<SecondaryItem
					title="qzyq"
					destKey="qzyq"
					icon={<IconWater />}
					onPress={() => {
						navigation.navigate("Qzyq", {ticketNumber: 0});
					}}
				/>
				<SecondaryItem
					title="dormScore"
					destKey="dormScore"
					icon={<IconDormScore />}
					onPress={() => {
						navigation.navigate("DormScore");
					}}
				/>
				<SecondaryItem
					title="electricity"
					destKey="electricity"
					icon={<IconEleRecharge />}
					onPress={() => {
						navigation.navigate("Electricity");
					}}
				/>
			</View>
		</View>
	);
};
