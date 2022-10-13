import React from "react";
import {getStr} from "../../utils/i18n";
import {State} from "../../redux/store";
import {Text, TouchableOpacity, useColorScheme, View} from "react-native";
import {RoundedView} from "../../components/views";
import {useDispatch, useSelector} from "react-redux";
import {styles} from "./settings";
import IconCheck from "../../assets/icons/IconCheck";
import {configSet} from "../../redux/slices/config";

export const DarkModeScreen = () => {
	const themeName = useColorScheme();
	const style = styles(themeName);

	const darkMode = useSelector((s: State) => s.config.darkMode);
	const dispatch = useDispatch();

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				<TouchableOpacity
					style={style.touchable}
					onPress={() => {
						dispatch(configSet({key: "darkMode", value: false}));
					}}>
					<Text style={style.text}>{getStr("autoFollow")}</Text>
					{darkMode !== true && <IconCheck width={18} height={18} />}
				</TouchableOpacity>
				<View style={style.separator} />
				<TouchableOpacity
					style={style.touchable}
					onPress={() => {
						dispatch(configSet({key: "darkMode", value: true}));
					}}>
					<Text style={style.text}>{getStr("enableDarkMode")}</Text>
					{darkMode === true && <IconCheck width={18} height={18} />}
				</TouchableOpacity>
			</RoundedView>
		</View>
	);
};
