import {Linking, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import React, {useEffect} from "react";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {
	ASHITEMARU_URL,
	GITHUB_REPO_URL,
	LIB_URL,
	UNIDY2002_URL,
} from "../../constants/strings";
import VersionNumber from "react-native-version-number";
import {useColorScheme} from "react-native-appearance";
import {store} from "../../redux/store";
import {SET_LIB_INTRODUCED} from "../../redux/constants";

const makeLinking = (url: string) =>
	Linking.openURL(url).then(() =>
		console.log("Opening " + url + " in system explorer"),
	);

export const AboutScreen = () => {
	const themeName = useColorScheme();
	const theme = themes[themeName];

	useEffect(() => {
		store.dispatch({type: SET_LIB_INTRODUCED});
	});

	return (
		<View style={{paddingTop: 5, paddingBottom: 20, flex: 1}}>
			<Text style={[styles.textStyle, {color: theme.colors.text}]}>
				{`${getStr("currentVersion")}v${VersionNumber.appVersion}`}
			</Text>
			<TouchableOpacity onPress={() => makeLinking(GITHUB_REPO_URL)}>
				<Text style={[styles.textStyle, {color: theme.colors.primaryLight}]}>
					UNIDY2002 / THUInfo @ GitHub
				</Text>
			</TouchableOpacity>
			<View style={{height: 10}} />
			<Text style={[styles.textStyle, {color: theme.colors.text}]}>
				{getStr("maintainers")}
			</Text>
			<TouchableOpacity onPress={() => makeLinking(UNIDY2002_URL)}>
				<Text
					style={[
						styles.textStyle,
						{color: theme.colors.primaryLight, fontSize: 17},
					]}>
					(Android) UNIDY2002 @ GitHub
				</Text>
			</TouchableOpacity>
			<TouchableOpacity onPress={() => makeLinking(ASHITEMARU_URL)}>
				<Text
					style={[
						styles.textStyle,
						{color: theme.colors.primaryLight, fontSize: 17},
					]}>
					(iOS) Ashitemaru @ GitHub
				</Text>
			</TouchableOpacity>
			<View style={{height: 10}} />
			<Text style={[styles.textStyle, {color: theme.colors.text}]}>
				{getStr("libText")}
				<Text style={{color: "red"}}> [NEW]</Text>
			</Text>
			<TouchableOpacity onPress={() => makeLinking(LIB_URL)}>
				<Text
					style={[
						styles.textStyle,
						{color: theme.colors.primaryLight, fontSize: 14},
					]}>
					thu-info-community / thu-info-lib @ GitHub
				</Text>
			</TouchableOpacity>
			<View style={{flex: 1}} />
			<Text
				style={[styles.textStyle, {fontSize: 15, color: theme.colors.text}]}>
				{getStr("builtWithRN")}
			</Text>
			<Text
				style={[styles.textStyle, {fontSize: 15, color: theme.colors.text}]}>
				© 2021 | UNIDY
			</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	textStyle: {
		textAlign: "center",
		padding: 10,
		fontSize: 17,
	},
});
