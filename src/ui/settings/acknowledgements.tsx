import {ScrollView, StyleSheet, Text} from "react-native";
import React from "react";
import packageConfig from "../../../package.json";
import {getStr} from "../../utils/i18n";

const deps = [
	...Object.keys(packageConfig.dependencies),
	...Object.keys(packageConfig.devDependencies),
];

export const AcknowledgementsScreen = () => (
	<ScrollView style={{paddingVertical: 15}}>
		<Text />
		<Text style={[styles.center]}>{getStr("acknowledgeLearnX")}</Text>
		<Text style={[styles.center]}>{getStr("acknowledgeCommunity")}</Text>
		{deps.map((value, index) => (
			<Text style={{textAlign: "center", marginVertical: 2}} key={index}>
				{value}
			</Text>
		))}
		<Text />
	</ScrollView>
);

const styles = StyleSheet.create({
	center: {
		alignSelf: "center",
		marginBottom: 20,
		fontSize: 18,
	},
});
