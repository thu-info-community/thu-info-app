import {Alert, Linking, ScrollView, Text, View} from "react-native";
import React, {ReactElement} from "react";
import {HomeNav, HomeStackParamList} from "./homeStack";
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

const recordAndNavigate = (
	functionName: HomeFunction,
	navigateTo: keyof HomeStackParamList | null,
	navigation: HomeNav,
) => {
	if (functionName === "libRoomBook") {
		Alert.alert(getStr("externalLink"), getStr("libRoomBookHint"), [
			{text: getStr("cancel")},
			{
				text: getStr("confirm"),
				onPress: () => {
					Linking.openURL("http://cab.hs.lib.tsinghua.edu.cn");
				},
			},
		]);
	} else {
		navigation.navigate(navigateTo as keyof HomeStackParamList);
	}
};

const getHomeFunctions = ({
	navigation,
}: {
	navigation: HomeNav;
}): ReactElement[] => [
	<HomeIcon
		key="report"
		title="report"
		onPress={() => recordAndNavigate("report", "Report", navigation)}>
		<IconReport width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="teachingEvaluation"
		title="teachingEvaluation"
		onPress={() =>
			recordAndNavigate("teachingEvaluation", "Evaluation", navigation)
		}>
		<IconEvaluation width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="gitLab"
		title="gitLab"
		onPress={() => recordAndNavigate("gitLab", "GitLabHome", navigation)}>
		<IconGitLab width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="classroomState"
		title="classroomState"
		onPress={() =>
			recordAndNavigate("classroomState", "ClassroomList", navigation)
		}>
		<IconClassroom width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="library"
		title="library"
		onPress={() => recordAndNavigate("library", "Library", navigation)}>
		<IconLibrary width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="libRoomBook"
		title="libRoomBook"
		onPress={() => recordAndNavigate("libRoomBook", null, navigation)}>
		<IconLibRoom width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="reservesLib"
		title="reservesLib"
		onPress={() =>
			recordAndNavigate("reservesLib", "ReservesLibWelcome", navigation)
		}>
		<IconBook width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="expenditure"
		title="expenditure"
		onPress={() => recordAndNavigate("expenditure", "Expenditure", navigation)}>
		<IconExpenditure width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="sportsBook"
		title="sportsBook"
		onPress={() => recordAndNavigate("sportsBook", "Sports", navigation)}>
		<IconSports width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="bankPayment"
		title="bankPayment"
		onPress={() => recordAndNavigate("bankPayment", "BankPayment", navigation)}>
		<IconBankPayment width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="invoice"
		title="invoice"
		onPress={() => recordAndNavigate("invoice", "Invoice", navigation)}>
		<IconInvoice width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="qzyq"
		title="qzyq"
		onPress={() => recordAndNavigate("qzyq", "Qzyq", navigation)}>
		<IconWater width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="washer"
		title="washer"
		onPress={() => recordAndNavigate("washer", "WasherWeb", navigation)}>
		<IconWasher width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="electricity"
		title="electricity"
		onPress={() => recordAndNavigate("electricity", "Electricity", navigation)}>
		<IconEleRecharge width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="eCard"
		title="eCard"
		onPress={() => recordAndNavigate("eCard", "ECard", navigation)}>
		<IconCard width={iconSize} height={iconSize} />
	</HomeIcon>,
];

let homeFunctions: ReactElement[];

export const HomeScreen = ({navigation}: {navigation: HomeNav}) => {
	const theme = themes(useColorScheme());
	homeFunctions = getHomeFunctions({navigation});

	return (
		<ScrollView style={{backgroundColor: theme.colors.background2}}>
			<HomeFunctionSection title="recentlyUsedFunction">
				{[homeFunctions.slice(1, 6)]}
			</HomeFunctionSection>
			<HomeFunctionSection title="allFunction">
				{[...homeFunctions]}
			</HomeFunctionSection>
		</ScrollView>
	);
};

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
