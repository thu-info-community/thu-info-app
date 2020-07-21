import {StyleSheet, Text, View} from "react-native";
import React from "react";
import {getSchedule} from "../../network/schedule";

export const ScheduleScreen = () => {
	getSchedule().then((str) => console.log(str));
	return (
		<View style={styles.center}>
			<Text>这是计划。</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	center: {flex: 1, alignItems: "center", justifyContent: "center"},
});
