import {ScrollView, StyleSheet, Text} from "react-native";
import React from "react";
import packageConfig from "../../../package.json";
import {getStr} from "../../utils/i18n";
import {useColorScheme} from "react-native-appearance";
import themes from "../../assets/themes/themes";

const deps = [
	...Object.keys(packageConfig.dependencies),
	...Object.keys(packageConfig.devDependencies),
];

export const AcknowledgementsScreen = () => {
	const themeName = useColorScheme();
	const {colors} = themes[themeName];
	return (
		<ScrollView style={{paddingVertical: 15}}>
			<Text />
			<Text style={[styles.center, {color: colors.text}]}>
				{getStr("acknowledgeLearnX")}
			</Text>
			<Text style={[styles.center, {color: colors.text}]}>
				{getStr("acknowledgeCommunity")}
			</Text>
			{deps.map((value, index) => (
				<Text
					style={{textAlign: "center", marginVertical: 2, color: colors.text}}
					key={index}>
					{value}
				</Text>
			))}
			<Text />
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	center: {
		alignSelf: "center",
		marginBottom: 20,
		fontSize: 18,
	},
});
