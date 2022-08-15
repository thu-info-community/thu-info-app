import React, {useState} from "react";
import {getStr} from "../../utils/i18n";
import {State, store} from "../../redux/store";
import {Alert, Switch, Text, useColorScheme, View} from "react-native";
import {connect} from "react-redux";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";
import {styles} from "./settings";
import {RootNav} from "../../components/Root";
import {setAppSecretAction} from "../../redux/actions/credentials";

const AppSecretUI = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const {colors} = themes(themeName);

	const [enabled, setEnabled] = useState(true);

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("appSecret")}</Text>
					<Switch
						thumbColor={colors.primaryLight}
						trackColor={{true: colors.mainTheme}}
						value={enabled}
						onValueChange={() => {
							setEnabled(false);
							Alert.alert(
								getStr("confirmDisableAppSecretTitle"),
								getStr("confirmDisableAppSecretMessage"),
								[
									{
										text: getStr("cancel"),
										onPress: () => setEnabled(true),
									},
									{
										text: getStr("confirm"),
										onPress: () => {
											navigation.pop();
											store.dispatch(setAppSecretAction(undefined));
										},
									},
								],
								{cancelable: true, onDismiss: () => setEnabled(true)},
							);
						}}
					/>
				</View>
			</RoundedView>
		</View>
	);
};

export const AppSecretScreen = connect((state: State) => ({
	...state.credentials,
}))(AppSecretUI);
