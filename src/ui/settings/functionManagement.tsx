import React from "react";
import {getStr} from "../../utils/i18n";
import {State} from "../../redux/store";
import {Text, useColorScheme, View} from "react-native";
import {connect} from "react-redux";
import themes from "../../assets/themes/themes";

const FunctionManagementUI = () => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<View style={{flex: 1, padding: 12}}>
			<Text style={{marginLeft: 8, color: colors.fontB2}}>
				{getStr("functionManagementTip")}
			</Text>
		</View>
	);
};

export const FunctionManagementScreen = connect((state: State) => ({
	...state.config,
}))(FunctionManagementUI);
