import {Button, StyleSheet, View} from "react-native";
import React from "react";
import {getStr} from "../../utils/i18n";
import {HomeNav} from "./homeStack";
import {performLoseCard} from "../../components/home/loseCard";

export const HomeScreen = ({navigation}: {navigation: HomeNav}) => (
	<View style={styles.center}>
		<Button
			title={getStr("report")}
			onPress={() => navigation.navigate("Report")}
		/>
		<Button
			title={getStr("teachingEvaluation")}
			onPress={() => navigation.navigate("Evaluation")}
		/>
		<Button
			title={getStr("expenditure")}
			onPress={() => navigation.navigate("Expenditure")}
		/>
		<Button
			title={getStr("classroomState")}
			onPress={() => navigation.navigate("ClassroomList")}
		/>
		<Button title={getStr("loseCard")} onPress={performLoseCard} />
		<Button
			title={getStr("wentu")}
			onPress={() => navigation.navigate("Wentu")}
		/>
	</View>
);

const styles = StyleSheet.create({
	center: {flex: 1, alignItems: "center", justifyContent: "center"},
});
