import React from "react";
import {RootNav} from "../../components/Root";
import {useColorScheme, View} from "react-native";
import {
	SecondaryItem,
	secondaryItemIconSize,
	SecondaryItemSeparator,
	styles,
} from "../../components/home/secondaryItems";
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
					icon={
						<IconWasher
							width={secondaryItemIconSize}
							height={secondaryItemIconSize}
						/>
					}
					onPress={() => {
						navigation.navigate("WasherWeb");
					}}
				/>
				<SecondaryItemSeparator />
				<SecondaryItem
					title="qzyq"
					destKey="qzyq"
					icon={
						<IconWater
							width={secondaryItemIconSize}
							height={secondaryItemIconSize}
						/>
					}
					onPress={() => {
						navigation.navigate("Qzyq");
					}}
				/>
				<SecondaryItemSeparator />
				<SecondaryItem
					title="dormScore"
					destKey="dormScore"
					icon={
						<IconDormScore
							width={secondaryItemIconSize}
							height={secondaryItemIconSize}
						/>
					}
					onPress={() => {
						navigation.navigate("DormScore");
					}}
				/>
				<SecondaryItemSeparator />
				<SecondaryItem
					title="electricity"
					destKey="electricity"
					icon={
						<IconEleRecharge
							width={secondaryItemIconSize}
							height={secondaryItemIconSize}
						/>
					}
					onPress={() => {
						navigation.navigate("Electricity");
					}}
				/>
			</View>
		</View>
	);
};
