import {StyleSheet, Text, View} from "react-native";
import React from "react";

export const HomeScreen = () => {
	return (
		<View style={styles.center}>
			<Text>这是主页。</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	center: {flex: 1, alignItems: "center", justifyContent: "center"},
});
