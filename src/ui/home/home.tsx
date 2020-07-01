import {Button, StyleSheet, Text, View} from "react-native";
import React from "react";

export const HomeScreen = (props: {
	navigation: {navigate: (dest: string) => void};
}) => (
	<View style={styles.center}>
		<Text>这是主页。</Text>
		<Button
			title="成绩单"
			onPress={() => props.navigation.navigate("成绩单")}
		/>
	</View>
);

const styles = StyleSheet.create({
	center: {flex: 1, alignItems: "center", justifyContent: "center"},
});
