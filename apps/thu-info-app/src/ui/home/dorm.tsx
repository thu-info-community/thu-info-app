import {RootNav} from "../../components/Root";
import {useColorScheme, View} from "react-native";
import {SecondaryItem, styles} from "../../components/home/secondaryItems";
import IconWasher from "../../assets/icons/IconWasher";
import IconWater from "../../assets/icons/IconWater";
import IconDormScore from "../../assets/icons/IconDormScore";
// import IconEleRecharge from "../../assets/icons/IconEleRecharge";
import {addUsageStat, FunctionType} from "../../utils/webApi";
import {currState} from "../../redux/store";

export const DormScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const disabledFunction = currState().config.homeFunctionDisabled;
	return (
		<View style={style.SecondaryRootView}>
			<View style={style.SecondaryContentView}>
				{!disabledFunction.includes("washer") && (
					<SecondaryItem
						title="washer"
						destKey="washer"
						icon={<IconWasher />}
						onPress={() => {
							addUsageStat(FunctionType.WasherInfo);
							navigation.navigate("Washer");
						}}
					/>
				)}
			</View>
		</View>
	);
};
