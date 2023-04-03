import {useColorScheme, View} from "react-native";
import {RootNav} from "../../components/Root";
import {currState} from "../../redux/store";
import {SecondaryItem, styles} from "../../components/home/secondaryItems";
import {addUsageStat, FunctionType} from "../../utils/webApi";
import IconWasher from "../../assets/icons/IconWasher";

export const NetworkScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const disabledFunction = currState().config.homeFunctionDisabled;
	return (
		<View style={style.SecondaryRootView}>
			<View style={style.SecondaryContentView}>
				{!disabledFunction.includes("networkDetail") && (
					<SecondaryItem
						title="networkDetail"
						destKey="networkDetail"
						// TODO: New Icon
						icon={<IconWasher />}
						onPress={() => {
							addUsageStat(FunctionType.NetworkDetail);
							navigation.navigate("NetworkDetail");
						}}
					/>
				)}
				{!disabledFunction.includes("onlineDevices") && (
					<SecondaryItem
						title="onlineDevices"
						destKey="onlineDevices"
						// TODO: New Icon
						icon={<IconWasher />}
						onPress={() => {
							addUsageStat(FunctionType.OnlineDevices);
							navigation.navigate("OnlineDevices");
						}}
					/>
				)}
			</View>
		</View>
	);
};
