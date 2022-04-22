import {Alert, Linking, ScrollView, Text, View} from "react-native";
import React, {ReactElement} from "react";
import {HomeNav} from "./homeStack";
import IconReport from "../../assets/icons/IconReport";
import {HomeIcon} from "../../components/home/icon";
import IconExpenditure from "../../assets/icons/IconExpenditure";
import IconClassroom from "../../assets/icons/IconClassroom";
import IconEvaluation from "../../assets/icons/IconEvaluation";
import IconLibrary from "../../assets/icons/IconLibrary";
import zh from "../../assets/translations/zh";
import {getStr} from "../../utils/i18n";
import themedStyles from "../../utils/themedStyles";
import {useColorScheme} from "react-native";
import IconWasher from "../../assets/icons/IconWasher";
import IconWater from "../../assets/icons/IconWater";
import IconSports from "../../assets/icons/IconSports";
import IconGitLab from "../../assets/icons/IconGitLab";
import IconBook from "../../assets/icons/IconBook";
import IconBankPayment from "../../assets/icons/IconBankPayment";
import IconInvoice from "../../assets/icons/IconInvoice";
import IconEleRecharge from "../../assets/icons/IconEleRecharge";
import IconCard from "../../assets/icons/IconCard";
import IconLibRoom from "../../assets/icons/IconLibRoom";
import themes from "../../assets/themes/themes";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {top5UpdateAction} from "../../redux/actions/top5";

const iconSize = 40;

export const HomeFunctionSection = ({
	title,
	children,
}: {
	title: keyof typeof zh;
	children: any;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);

	return (
		<View style={style.functionSectionContainer}>
			<Text style={style.functionSectionTitle}>{getStr(title)}</Text>
			<View style={style.functionSectionContentContainer}>
				<View style={style.functionSectionContent}>{children}</View>
			</View>
		</View>
	);
};

export const HomeLibrarySection = ({}: {
	title: keyof typeof zh;
	children: any;
}) => {
	// TODO
};

export type HomeFunction =
	| "report"
	| "teachingEvaluation"
	| "gitLab"
	| "classroomState"
	| "library"
	| "libRoomBook"
	| "reservesLib"
	| "expenditure"
	| "sportsBook"
	| "bankPayment"
	| "invoice"
	| "qzyq"
	| "washer"
	| "electricity"
	| "eCard";

const getHomeFunctions = (
	navigation: HomeNav,
	updateTop5: (func: HomeFunction) => void,
): ReactElement[] => [
	<HomeIcon
		key="report"
		title="report"
		onPress={() => {
			updateTop5("report");
			navigation.navigate("Report");
		}}>
		<IconReport width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="teachingEvaluation"
		title="teachingEvaluation"
		onPress={() => {
			updateTop5("teachingEvaluation");
			navigation.navigate("Evaluation");
		}}>
		<IconEvaluation width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="gitLab"
		title="gitLab"
		onPress={() => {
			updateTop5("gitLab");
			navigation.navigate("GitLabHome");
		}}>
		<IconGitLab width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="classroomState"
		title="classroomState"
		onPress={() => {
			updateTop5("classroomState");
			navigation.navigate("ClassroomList");
		}}>
		<IconClassroom width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="library"
		title="library"
		onPress={() => {
			updateTop5("library");
			navigation.navigate("Library");
		}}>
		<IconLibrary width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="libRoomBook"
		title="libRoomBook"
		onPress={() => {
			updateTop5("libRoomBook");
			Alert.alert(getStr("externalLink"), getStr("libRoomBookHint"), [
				{text: getStr("cancel")},
				{
					text: getStr("confirm"),
					onPress: () => {
						Linking.openURL("http://cab.hs.lib.tsinghua.edu.cn");
					},
				},
			]);
		}}>
		<IconLibRoom width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="reservesLib"
		title="reservesLib"
		onPress={() => {
			updateTop5("reservesLib");
			navigation.navigate("ReservesLibWelcome");
		}}>
		<IconBook width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="expenditure"
		title="expenditure"
		onPress={() => {
			updateTop5("expenditure");
			navigation.navigate("Expenditure");
		}}>
		<IconExpenditure width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="sportsBook"
		title="sportsBook"
		onPress={() => {
			updateTop5("sportsBook");
			navigation.navigate("Sports");
		}}>
		<IconSports width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="bankPayment"
		title="bankPayment"
		onPress={() => {
			updateTop5("bankPayment");
			navigation.navigate("BankPayment");
		}}>
		<IconBankPayment width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="invoice"
		title="invoice"
		onPress={() => {
			updateTop5("invoice");
			navigation.navigate("Invoice");
		}}>
		<IconInvoice width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="qzyq"
		title="qzyq"
		onPress={() => {
			updateTop5("qzyq");
			navigation.navigate("Qzyq");
		}}>
		<IconWater width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="washer"
		title="washer"
		onPress={() => {
			updateTop5("washer");
			navigation.navigate("WasherWeb");
		}}>
		<IconWasher width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="electricity"
		title="electricity"
		onPress={() => {
			updateTop5("electricity");
			navigation.navigate("Electricity");
		}}>
		<IconEleRecharge width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="eCard"
		title="eCard"
		onPress={() => {
			updateTop5("eCard");
			navigation.navigate("ECard");
		}}>
		<IconCard width={iconSize} height={iconSize} />
	</HomeIcon>,
];

interface HomeProps {
	navigation: HomeNav;
	top5Functions: string[];
	updateTop5: (payload: string) => void;
}

const HomeUI = (props: HomeProps) => {
	const theme = themes(useColorScheme());
	const homeFunctions = getHomeFunctions(props.navigation, props.updateTop5);
	const top5 = props.top5Functions.map((x) =>
		homeFunctions.find((y) => y.key === x),
	);

	return (
		<ScrollView style={{backgroundColor: theme.colors.background2}}>
			<HomeFunctionSection title="recentlyUsedFunction">
				{top5}
			</HomeFunctionSection>
			<HomeFunctionSection title="allFunction">
				{homeFunctions}
			</HomeFunctionSection>
		</ScrollView>
	);
};

export const HomeScreen = connect(
	(state: State) => ({
		...state.top5,
	}),
	(dispatch) => ({
		updateTop5: (payload: string) => dispatch(top5UpdateAction(payload)),
	}),
)(HomeUI);

const styles = themedStyles((theme) => ({
	functionSectionContainer: {
		marginHorizontal: 12,
	},
	functionSectionContentContainer: {
		backgroundColor: theme.colors.background,
		shadowColor: "grey",
		borderRadius: 20,
		paddingHorizontal: 12,
		paddingBottom: 12,
		minHeight: 92, // this value is produced by trying many times...
	},
	functionSectionTitle: {
		textAlign: "left",
		fontSize: 15,
		marginTop: 18,
		marginLeft: 12,
		marginBottom: 8,
		fontWeight: "bold",
		color: theme.colors.text,
	},
	functionSectionContent: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "flex-start",
	},
}));
