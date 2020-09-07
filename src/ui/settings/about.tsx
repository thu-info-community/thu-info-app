import {Linking, StyleSheet, Text, TouchableOpacity, View} from "react-native";
import React, {useContext} from "react";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {
	ASHITEMARU_URL,
	GITHUB_REPO_URL,
	UNIDY2002_URL,
} from "../../constants/strings";
import VersionNumber from "react-native-version-number";

const makeLinking = (url: string) =>
	Linking.openURL(url).then(() =>
		console.log("Opening " + url + " in system explorer"),
	);

export const AboutScreen = () => {
	const themeName = useContext(ThemeContext);
	const theme = themes[themeName];
	return (
		<View style={{paddingTop: 5, paddingBottom: 20, flex: 1}}>
			<Text style={styles.textStyle}>
				{`${getStr("currentVersion")}v${VersionNumber.appVersion}`}
			</Text>
			<TouchableOpacity onPress={() => makeLinking(GITHUB_REPO_URL)}>
				<Text style={[styles.textStyle, {color: theme.colors.primaryLight}]}>
					UNIDY2002 / THUInfo @ GitHub
				</Text>
			</TouchableOpacity>
			<View style={{height: 10}} />
			<Text style={[styles.textStyle]}>{getStr("maintainers")}</Text>
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
			<View style={{flex: 1}} />
			<Text style={[styles.textStyle, {fontSize: 15}]}>
				{getStr("builtWithRN")}
			</Text>
			<Text style={[styles.textStyle, {fontSize: 15}]}>© 2020 | UNIDY</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	textStyle: {
		textAlign: "center",
		padding: 10,
		fontSize: 18,
	},
});
