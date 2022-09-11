import React from "react";
import {RootNav} from "../../components/Root";
import {useColorScheme, View} from "react-native";
import {SecondaryItem, styles} from "../../components/home/secondaryItems";
import IconLibrary from "../../assets/icons/IconLibrary";
import IconSports from "../../assets/icons/IconSports";
import IconLibRoom from "../../assets/icons/IconLibRoom";
import {addUsageStat, FunctionType} from "../../utils/webApi";
import {currState} from "../../redux/store";

export const ReserveScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const disabledFunction = currState().config.homeFunctionDisabled;
	return (
		<View style={style.SecondaryRootView}>
			<View style={style.SecondaryContentView}>
				{!disabledFunction.includes("library") && (
					<SecondaryItem
						title="library"
						destKey="library"
						icon={<IconLibrary />}
						onPress={() => {
							addUsageStat(FunctionType.Library);
							navigation.navigate("Library");
						}}
					/>
				)}
				{!disabledFunction.includes("sportsBook") && (
					<SecondaryItem
						title="sportsBook"
						destKey="sportsBook"
						icon={<IconSports />}
						onPress={() => {
							addUsageStat(FunctionType.GymnasiumReg);
							navigation.navigate("Sports");
						}}
					/>
				)}
				{!disabledFunction.includes("libRoomBook") && (
					<SecondaryItem
						title="libRoomBook"
						destKey="libRoomBook"
						icon={<IconLibRoom />}
						onPress={() => {
							addUsageStat(FunctionType.PrivateRooms);
							navigation.navigate("LibRoomSelect");
						}}
					/>
				)}
			</View>
		</View>
	);
};
