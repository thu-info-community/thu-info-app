import React from "react";
import {Text, StyleSheet, View} from "react-native";
import {Form} from "../../models/home/assessment";

export const FormScreen = ({route}: any) => {
	const name: string = route.params.name;
	const form: Form = route.params.form;

	return (
		<View style={styles.container}>
			<Text>{name}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});
