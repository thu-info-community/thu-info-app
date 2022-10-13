import {getStr} from "../../utils/i18n";
import {State} from "../../redux/store";
import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import {connect} from "react-redux";
import {RoundedView} from "../../components/views";
import {styles} from "./settings";
import {configSet} from "../../redux/slices/config";
import IconCheck from "../../assets/icons/IconCheck";
import {RootNav} from "../../components/Root";

const AppSecretSelectLockTimeUI = ({
	navigation,
	appSecretLockMinutes,
	setLockTime,
}: {
	navigation: RootNav;
	appSecretLockMinutes: number | undefined;
	setLockTime: (numMinutes: number) => void;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				<TouchableOpacity
					style={style.touchable}
					onPress={() => {
						setLockTime(0);
						navigation.pop();
					}}>
					<Text style={style.text}>{getStr("instantly")}</Text>
					{(appSecretLockMinutes === undefined ||
						appSecretLockMinutes === 0) && <IconCheck width={18} height={18} />}
				</TouchableOpacity>
				{[1, 5, 15].map((num) => (
					<View key={num}>
						<View style={style.separator} />
						<TouchableOpacity
							style={style.touchable}
							onPress={() => {
								setLockTime(num);
								navigation.pop();
							}}>
							<Text style={style.text}>
								{num} {getStr(num === 1 ? "minute" : "minutes")}
							</Text>
							{appSecretLockMinutes === num && (
								<IconCheck width={18} height={18} />
							)}
						</TouchableOpacity>
					</View>
				))}
			</RoundedView>
		</View>
	);
};

export const AppSecretSelectLockTimeScreen = connect(
	(state: State) => ({
		...state.config,
	}),
	(dispatch) => ({
		setLockTime: (numMinutes: number) =>
			dispatch(configSet({key: "appSecretLockMinutes", value: numMinutes})),
	}),
)(AppSecretSelectLockTimeUI);
