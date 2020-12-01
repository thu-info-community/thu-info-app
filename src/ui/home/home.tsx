import {ScrollView, Text, View} from "react-native";
import React from "react";
import {HomeNav} from "./homeStack";
import {configureDorm} from "./configureDorm";
import IconReport from "../../assets/icons/IconReport";
import {HomeIcon} from "../../components/home/icon";
import IconPhysicalExam from "../../assets/icons/IconPhysicalExam";
import IconExpenditure from "../../assets/icons/IconExpenditure";
import IconClassroom from "../../assets/icons/IconClassroom";
import IconLibrary from "../../assets/icons/IconLibrary";
import IconDormScore from "../../assets/icons/IconDormScore";
import zh from "../../assets/translations/zh";
import {getStr} from "../../utils/i18n";
import IconHole from "../../assets/icons/IconHole";
import {mocked} from "../../redux/store";
import IconEvaluation from "../../assets/icons/IconEvaluation";

const iconSize = 60;

export const HomeSection = ({
	title,
	children,
}: {
	title: keyof typeof zh;
	children: any;
}) => (
	<View
		style={{
			justifyContent: "center",
			backgroundColor: "white",
			alignItems: "center",
			shadowColor: "grey",
			margin: 10,
			padding: 4,
			shadowOffset: {
				width: 2,
				height: 2,
			},
			shadowOpacity: 0.8,
			shadowRadius: 2,
			borderRadius: 5,
			elevation: 2,
		}}>
		<Text
			style={{
				textAlign: "center",
				fontSize: 15,
				marginTop: 6,
				fontWeight: "bold",
			}}>
			{getStr(title)}
		</Text>
		<View
			style={{
				flexDirection: "row",
				flexWrap: "wrap",
				justifyContent: "center",
			}}>
			{children}
		</View>
	</View>
);

export const HomeScreen = ({navigation}: {navigation: HomeNav}) => (
	<ScrollView style={{padding: 4}}>
		<HomeSection title="study">
			<HomeIcon title="report" onPress={() => navigation.navigate("Report")}>
				<IconReport width={iconSize} height={iconSize} />
			</HomeIcon>
			<HomeIcon
				title="physicalExam"
				onPress={() => navigation.navigate("PhysicalExam")}>
				<IconPhysicalExam width={iconSize} height={iconSize} />
			</HomeIcon>
			<HomeIcon
				title="teachingEvaluation"
				onPress={() => navigation.navigate("Evaluation")}>
				<IconEvaluation width={iconSize} height={iconSize} />
			</HomeIcon>
		</HomeSection>
		<HomeSection title="resources">
			<HomeIcon
				title="classroomState"
				onPress={() => navigation.navigate("ClassroomList")}>
				<IconClassroom width={iconSize} height={iconSize} />
			</HomeIcon>
			<HomeIcon title="library" onPress={() => navigation.navigate("Library")}>
				<IconLibrary width={iconSize} height={iconSize} />
			</HomeIcon>
		</HomeSection>
		<HomeSection title="life">
			<HomeIcon
				title="expenditure"
				onPress={() => navigation.navigate("Expenditure")}>
				<IconExpenditure width={iconSize} height={iconSize} />
			</HomeIcon>
			{/*<AlipayPopup
				onPay={(money) => getEleRechargePayCode(money).then(doAlipay)}
				title="eleRecharge"
				navigation={navigation}>
				<IconEleRecharge width={iconSize} height={iconSize} />
			</AlipayPopup>*/}
			<HomeIcon
				title="dormScore"
				onPress={() =>
					configureDorm(() => navigation.navigate("DormScore"), navigation)
				}>
				<IconDormScore width={iconSize} height={iconSize} />
			</HomeIcon>
		</HomeSection>
		{!mocked() && (
			<HomeSection title="hole">
				<HomeIcon title="hole" onPress={() => navigation.navigate("HoleList")}>
					<IconHole width={iconSize} height={iconSize} />
				</HomeIcon>
			</HomeSection>
		)}
	</ScrollView>
);
