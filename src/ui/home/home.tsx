import {Button, StyleSheet, Text, View} from "react-native";
import React from "react";
import {getStr} from "../../utils/i18n";

export const HomeScreen = (props: {
	navigation: {navigate: (dest: string) => void};
}) => (
	<View style={styles.center}>
		<Text>这是主页。</Text>
		<Button
			title={getStr("report")}
			onPress={() => props.navigation.navigate(getStr("report"))}
		/>
	</View>
);

const styles = StyleSheet.create({
	center: {flex: 1, alignItems: "center", justifyContent: "center"},
});
