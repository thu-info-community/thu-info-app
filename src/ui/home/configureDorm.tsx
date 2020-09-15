import {Button, Text, TextInput, View, YellowBox} from "react-native";
import React, {useState} from "react";
import {connect} from "react-redux";
import {ConfigureDormRouteProp, HomeNav} from "./homeStack";
import {getStr} from "../../utils/i18n";
import {currState, mocked} from "../../redux/store";
import {SET_DORM_PASSWORD} from "../../redux/constants";
import {getTicket} from "../../network/core";
import Snackbar from "react-native-snackbar";
import {dormLoginStatus} from "../../utils/dorm";

const ConfigureDormUI = ({
	route,
	navigation,
	setDormPassword,
}: {
	route: ConfigureDormRouteProp;
	navigation: HomeNav;
	setDormPassword: (password: string) => void;
}) => {
	const [password, setPassword] = useState("");

	return (
		<View style={{alignItems: "center", padding: 10}}>
			<Text>{currState().auth.userId}</Text>
			<TextInput
				placeholder={getStr("password")}
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>
			<Button
				title={getStr("login")}
				onPress={() => {
					setDormPassword(password);
					getTicket(-1)
						.then(() => {
							if (dormLoginStatus.loggedIn) {
								navigation.pop();
								route.params.callback();
							} else {
								Snackbar.show({
									text: getStr("loginFailure"),
									duration: Snackbar.LENGTH_LONG,
								});
							}
						})
						.catch(() =>
							Snackbar.show({
								text: getStr("loginFailure"),
								duration: Snackbar.LENGTH_LONG,
							}),
						);
				}}
			/>
			<Text style={{margin: 10}}>{getStr("configureDormHint")}</Text>
		</View>
	);
};

export const ConfigureDormScreen = connect(undefined, (dispatch) => {
	return {
		setDormPassword: (password: string) =>
			dispatch({type: SET_DORM_PASSWORD, payload: password}),
	};
})(ConfigureDormUI);

export const configureDorm = (callback: () => any, navigation: HomeNav) => {
	if (mocked() || dormLoginStatus.loggedIn) {
		callback();
	} else {
		YellowBox.ignoreWarnings([
			"Non-serializable values were found in the navigation state",
		]);
		navigation.navigate("ConfigureDorm", {callback});
	}
};
