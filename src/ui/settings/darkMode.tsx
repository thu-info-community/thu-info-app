import React from "react";
import {getStr} from "../../utils/i18n";
import {State} from "../../redux/store";
import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import {RoundedView} from "../../components/views";
import {connect} from "react-redux";
import {styles} from "./settings";
import IconCheck from "../../assets/icons/IconCheck";
import {configSet} from "../../redux/actions/config";
import Snackbar from "react-native-snackbar";

export const DarkModeUI = ({
	darkMode,
	setDarkMode,
}: {
	darkMode: boolean | undefined;
	setDarkMode: (v: boolean) => any;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				<TouchableOpacity
					style={style.touchable}
					onPress={() => {
						setDarkMode(false);
						Snackbar.show({
							text: getStr("restartToApply"),
							duration: Snackbar.LENGTH_SHORT,
						});
					}}>
					<Text style={style.text}>{getStr("autoFollow")}</Text>
					{darkMode !== true && <IconCheck width={18} height={18} />}
				</TouchableOpacity>
				<View style={style.separator} />
				<TouchableOpacity
					style={style.touchable}
					onPress={() => {
						setDarkMode(true);
						Snackbar.show({
							text: getStr("restartToApply"),
							duration: Snackbar.LENGTH_SHORT,
						});
					}}>
					<Text style={style.text}>{getStr("enableDarkMode")}</Text>
					{darkMode === true && <IconCheck width={18} height={18} />}
				</TouchableOpacity>
			</RoundedView>
		</View>
	);
};

export const DarkModeScreen = connect(
	(state: State) => ({
		...state.config,
	}),
	(dispatch) => ({
		setDarkMode: (v: boolean) => dispatch(configSet("darkMode", v)),
	}),
)(DarkModeUI);
