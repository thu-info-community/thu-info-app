import {Text, TextInput, TouchableOpacity, View, YellowBox} from "react-native";
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
		<View
			style={{
				alignItems: "center",
				justifyContent: "center",
				padding: 10,
				height: 580,
			}}>
			<Text style={{fontSize: 18, marginVertical: 10, fontWeight: "bold"}}>
				{currState().auth.userId}
			</Text>
			<TextInput
				placeholder={getStr("password")}
				value={password}
				onChangeText={setPassword}
				style={{
					fontSize: 16,
					marginVertical: 10,
					height: 35,
					width: 200,
					backgroundColor: "white",
					textAlign: "left",
					borderColor: "lightgrey",
					borderWidth: 2,
					borderRadius: 5,
					padding: 7,
				}}
				secureTextEntry
			/>
			<TouchableOpacity
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
				style={{
					height: 35,
					width: 100,
					backgroundColor: "#3479f6",
					marginTop: 50,
					marginBottom: 20,
					justifyContent: "center",
					alignItems: "center",
					borderRadius: 8,
				}}>
				<Text style={{color: "white", fontWeight: "bold"}}>
					{getStr("login")}
				</Text>
			</TouchableOpacity>
			<Text style={{margin: 20}}>
				<Text style={{fontWeight: "bold", fontSize: 16}}>{getStr("tips")}</Text>
				<Text>{getStr("configureDormHint")}</Text>
			</Text>
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
