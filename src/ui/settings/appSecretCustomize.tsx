import React from "react";
import {getStr} from "../../utils/i18n";
import {State, store} from "../../redux/store";
import {Switch, Text, useColorScheme, View} from "react-native";
import {connect} from "react-redux";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";
import {styles} from "./settings";
import {configSet} from "../../redux/actions/config";

const AppSecretCustomizeUI = ({
	verifyPasswordBeforeEnterReport,
}: {
	verifyPasswordBeforeEnterReport: boolean | undefined;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const {colors} = themes(themeName);

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("report")}</Text>
					<Switch
						thumbColor={colors.contentBackground}
						trackColor={{true: colors.themePurple}}
						value={verifyPasswordBeforeEnterReport === true}
						onValueChange={(value) => {
							store.dispatch(
								configSet("verifyPasswordBeforeEnterReport", value),
							);
						}}
					/>
				</View>
			</RoundedView>
		</View>
	);
};

export const AppSecretCustomizeScreen = connect((state: State) => ({
	...state.config,
}))(AppSecretCustomizeUI);
