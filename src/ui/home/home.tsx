import {Button, StyleSheet, View} from "react-native";
import React from "react";
import {getStr} from "../../utils/i18n";
import {HomeNav} from "./homeStack";
import {performLoseCard} from "../../components/home/loseCard";
import {getEleRechargePayCode} from "../../network/dorm";
import Alipay from "../../utils/alipay";
import {AlipayPopup} from "../../components/home/alipayPopup";
import {configureDorm} from "./configureDorm";

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
			title={getStr("physicalExam")}
			onPress={() => navigation.navigate("PhysicalExam")}
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
		<Button
			title={getStr("dormScore")}
			onPress={() =>
				configureDorm(() => navigation.navigate("DormScore"), navigation)
			}
		/>
		<AlipayPopup
			onPay={(money) => getEleRechargePayCode(money).then(Alipay.pay)}
			title={getStr("eleRecharge")}
			navigation={navigation}
		/>
		<Button
			title={getStr("library")}
			onPress={() => navigation.navigate("Library")}
		/>
	</View>
);

const styles = StyleSheet.create({
	center: {flex: 1, alignItems: "center", justifyContent: "center"},
});
