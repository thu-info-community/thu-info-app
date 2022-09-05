import React from "react";
import {RootNav} from "../../components/Root";
import {useColorScheme, View} from "react-native";
import {SecondaryItem, styles} from "../../components/home/secondaryItems";
import IconWasher from "../../assets/icons/IconWasher";
import IconWater from "../../assets/icons/IconWater";
import IconDormScore from "../../assets/icons/IconDormScore";
import IconEleRecharge from "../../assets/icons/IconEleRecharge";
import {addUsageStat, FunctionType} from "../../utils/webApi";

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
						addUsageStat(FunctionType.WasherInfo);
						navigation.navigate("WasherWeb");
					}}
				/>
				<SecondaryItem
					title="qzyq"
					destKey="qzyq"
					icon={<IconWater />}
					onPress={() => {
						addUsageStat(FunctionType.QZYQ);
						navigation.navigate("Qzyq", {ticketNumber: 0});
					}}
				/>
				<SecondaryItem
					title="dormScore"
					destKey="dormScore"
					icon={<IconDormScore />}
					onPress={() => {
						addUsageStat(FunctionType.DormScore);
						navigation.navigate("DormScore");
					}}
				/>
				<SecondaryItem
					title="electricity"
					destKey="electricity"
					icon={<IconEleRecharge />}
					onPress={() => {
						addUsageStat(FunctionType.Electricity);
						navigation.navigate("Electricity");
					}}
				/>
			</View>
		</View>
	);
};
