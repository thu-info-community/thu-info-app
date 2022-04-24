import {
	Alert,
	Linking,
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import React, {ReactElement} from "react";
import {HomeNav} from "./homeStack";
import IconReport from "../../assets/icons/IconReport";
import {HomeIcon} from "../../components/home/icon";
import IconExpenditure from "../../assets/icons/IconExpenditure";
import IconClassroom from "../../assets/icons/IconClassroom";
import IconEvaluation from "../../assets/icons/IconEvaluation";
import IconLibrary from "../../assets/icons/IconLibrary";
import zh from "../../assets/translations/zh";
import {getLocale, getStr} from "../../utils/i18n";
import themedStyles from "../../utils/themedStyles";
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
import {currState, State} from "../../redux/store";
import {top5UpdateAction} from "../../redux/actions/top5";
import IconDormScore from "../../assets/icons/IconDormScore";
import {
	Schedule,
	ScheduleType,
} from "thu-info-lib/dist/models/schedule/schedule";
import dayjs from "dayjs";
import md5 from "md5";
import {ScheduleDetailProps} from "../schedule/scheduleDetail";

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
		<View style={style.SectionContainer}>
			<Text style={style.SectionTitle}>{getStr(title)}</Text>
			<View style={style.SectionContentContainer}>
				<View style={style.functionSectionContent}>{children}</View>
			</View>
		</View>
	);
};

const beginTimeZh = [
	"",
	"上午   8:00",
	"上午   8:50",
	"上午   9:50",
	"上午 10:40",
	"上午 11:30",
	"下午   1:30",
	"下午   2:20",
	"下午   3:20",
	"下午   4:10",
	"下午   5:05",
	"下午   5:55",
	"下午   7:20",
	"下午   8:10",
	"下午   9:00",
];

const endTimeZh = [
	"",
	"上午  8:45",
	"上午  9:35",
	"上午 10:35",
	"上午 11:25",
	"下午 12:15",
	"下午   2:15",
	"下午   3:05",
	"下午   4:05",
	"下午   4:55",
	"下午   5:50",
	"下午   6:40",
	"下午   8:05",
	"下午   8:55",
	"下午   9:45",
];

const beginTimeEn = [
	"",
	"8:00 AM",
	"8:50 AM",
	"9:50 AM",
	"10:40 AM",
	"11:30 AM",
	"1:30 PM",
	"2:20 PM",
	"3:20 PM",
	"4:10 PM",
	"5:05 PM",
	"5:55 PM",
	"7:20 PM",
	"8:10 PM",
	"9:00 PM",
];

const endTimeEn = [
	"",
	"8:45 AM",
	"9:35 AM",
	"10:35 AM",
	"11:25 AM",
	"12:15 PM",
	"2:15 PM",
	"3:05 PM",
	"4:05 PM",
	"4:55 PM",
	"5:50 PM",
	"6:40 PM",
	"8:05 PM",
	"8:55 PM",
	"9:45 PM",
];

interface ScheduleViewModel {
	name: string;
	location: string;
	from: number;
	to: number;
	color: string;
	navProps: ScheduleDetailProps;
}

const HomeSchedule = ({
	schedule,
	navigation,
}: {
	schedule: ScheduleViewModel;
	navigation: HomeNav;
}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	return (
		<TouchableOpacity
			onPress={() => {
				navigation.navigate("ScheduleDetail", schedule.navProps);
			}}>
			<View
				style={{
					backgroundColor: "#EAEAEA",
					height: 1,
					marginVertical: 4,
					marginLeft: 12,
				}}
			/>
			<View style={{flexDirection: "row"}}>
				<View
					style={{
						width: 4,
						backgroundColor: schedule.color,
						height: 50,
						borderRadius: 4,
					}}
				/>
				<View style={{marginLeft: 8, flex: 1, flexDirection: "column"}}>
					<View style={{flex: 1, flexDirection: "row"}}>
						<Text
							style={{
								alignSelf: "center",
								fontWeight: "bold",
								fontSize: 16,
								color: theme.colors.fontB0,
							}}>
							{schedule.name}
						</Text>
						<Text
							style={{
								flex: 1,
								alignSelf: "center",
								textAlign: "right",
								color: theme.colors.fontB0,
							}}>
							{getLocale() === zh
								? beginTimeZh[schedule.from]
								: beginTimeEn[schedule.from]}
						</Text>
					</View>
					<View style={{flex: 1, flexDirection: "row"}}>
						<Text
							style={{
								alignSelf: "center",
								fontWeight: "bold",
								color: theme.colors.fontB2,
							}}>
							{schedule.location}
						</Text>
						<Text
							style={{
								flex: 1,
								alignSelf: "center",
								textAlign: "right",
								color: theme.colors.fontB2,
							}}>
							{getLocale() === zh
								? endTimeZh[schedule.to]
								: endTimeEn[schedule.to]}
						</Text>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
};

export const HomeScheduleSection = ({
	baseSchedule,
	shortenMap,
	navigation,
}: {
	baseSchedule: Schedule[];
	shortenMap: {[key: string]: string | undefined};
	navigation: HomeNav;
}) => {
	const now = dayjs();
	const today = now.day() === 0 ? 7 : now.day();
	const tomorrow = today === 7 ? 1 : today + 1;
	const week = (() => {
		const {firstDay, weekCount} = currState().config;
		const weekNumber = Math.floor(now.diff(firstDay) / 604800000) + 1;
		if (weekNumber > weekCount) {
			return weekCount;
		} else if (weekNumber < 1) {
			return 1;
		} else {
			return weekNumber;
		}
	})();
	const colorList: string[] = [
		"#16A085",
		"#27AE60",
		"#2980B9",
		"#8E44AD",
		"#2C3E50",
		"#F39C12",
		"#D35400",
		"#C0392B",
		"#BDC3C7",
		"#7F8C8D",
	];
	const getColor = (x: string) =>
		colorList[parseInt(md5(x).substr(0, 6), 16) % colorList.length];
	const selectSchedule = (schedules: Schedule[], dayOfWeek: number) => {
		const a: ScheduleViewModel[] = [];
		for (const s of schedules) {
			for (const ss of s.activeTime.base) {
				if (ss.activeWeeks.includes(week)) {
					if (ss.dayOfWeek === dayOfWeek) {
						if (s.type === ScheduleType.CUSTOM) {
							a.push({
								name: shortenMap[s.name]?.slice(6) ?? s.name.slice(6),
								location: s.location,
								from: ss.begin,
								to: ss.end,
								color: getColor(s.name),
								navProps: {
									name: s.name,
									location: s.location,
									week: week,
									dayOfWeek: today,
									begin: ss.begin,
									end: ss.end,
									alias: shortenMap[s.name] ?? "",
									type: s.type,
								},
							});
						} else {
							a.push({
								name: shortenMap[s.name]?.slice(6) ?? s.name,
								location: s.location,
								from: ss.begin,
								to: ss.end,
								color: getColor(s.name),
								navProps: {
									name: s.name,
									location: s.location,
									week: week,
									dayOfWeek: today,
									begin: ss.begin,
									end: ss.end,
									alias: shortenMap[s.name] ?? "",
									type: s.type,
								},
							});
						}
					}
				}
			}
		}
		return a;
	};
	const todaySchedules = selectSchedule(baseSchedule, today);
	const tomorrowSchedules = selectSchedule(baseSchedule, tomorrow);

	const themeName = useColorScheme();
	const style = styles(themeName);

	const dayZh = [
		"",
		"星期一",
		"星期二",
		"星期三",
		"星期四",
		"星期五",
		"星期六",
		"星期天",
	];

	const dayEn = ["", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat.", "Sun."];

	return (
		<View style={style.SectionContainer}>
			<Text style={style.SectionTitle}>{getStr("schedulePreview")}</Text>
			<View style={style.SectionContentContainer}>
				<Text style={style.scheduleSectionContentPrimaryTitle}>
					{getLocale() === zh
						? `${now.month() + 1}月${now.date()}日 ${dayZh[today]}`
						: `${dayEn[today]} ${now.month() + 1}/${now.date()}`}
				</Text>
				{todaySchedules.map((x) => (
					<HomeSchedule key={x.name} schedule={x} navigation={navigation} />
				))}
				<Text style={style.scheduleSectionContentSecondaryTitle}>
					{getStr("scheduleTomorrow")}
				</Text>
				{tomorrowSchedules.map((x) => (
					<HomeSchedule key={x.name} schedule={x} navigation={navigation} />
				))}
			</View>
		</View>
	);
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
	| "eCard"
	| "dormScore";

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
	<HomeIcon
		key="dormScore"
		title="dormScore"
		onPress={() => {
			updateTop5("dormScore");
			navigation.navigate("DormScore");
		}}>
		<IconDormScore width={iconSize} height={iconSize} />
	</HomeIcon>,
];

interface HomeProps {
	navigation: HomeNav;
	top5Functions: string[];
	baseSchedule: Schedule[];
	shortenMap: {[key: string]: string | undefined};
	updateTop5: (payload: string) => void;
}

const HomeUI = (props: HomeProps) => {
	const theme = themes(useColorScheme());
	const homeFunctions = getHomeFunctions(props.navigation, props.updateTop5);
	const top5 = props.top5Functions.map((x) =>
		homeFunctions.find((y) => y.key === x),
	);
	const needToShowFunctionNames: HomeFunction[] = [
		"library",
		"expenditure",
		"dormScore",
		"report",
		"classroomState",
		"teachingEvaluation",
	];
	const needToShowFunctions = needToShowFunctionNames.map((x) =>
		homeFunctions.find((y) => y.key === x),
	);

	return (
		<ScrollView style={{backgroundColor: theme.colors.background2}}>
			<HomeFunctionSection title="recentlyUsedFunction">
				{top5}
			</HomeFunctionSection>
			<HomeScheduleSection
				baseSchedule={props.baseSchedule}
				shortenMap={props.shortenMap}
				navigation={props.navigation}
			/>
			<HomeFunctionSection title="allFunction">
				{needToShowFunctions}
			</HomeFunctionSection>
		</ScrollView>
	);
};

export const HomeScreen = connect(
	(state: State) => ({
		...state.top5,
		...state.schedule,
	}),
	(dispatch) => ({
		updateTop5: (payload: string) => dispatch(top5UpdateAction(payload)),
	}),
)(HomeUI);

const styles = themedStyles((theme) => ({
	SectionContainer: {
		marginHorizontal: 12,
	},
	SectionContentContainer: {
		backgroundColor: theme.colors.background,
		shadowColor: "grey",
		borderRadius: 20,
		paddingHorizontal: 12,
		paddingBottom: 12,
		minHeight: 92, // this value is produced by trying many times...
	},
	SectionTitle: {
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
	scheduleSectionContentPrimaryTitle: {
		color: "#5C179F",
		fontWeight: "bold",
		paddingTop: 8,
	},
	scheduleSectionContentSecondaryTitle: {
		color: theme.colors.fontB2,
		fontWeight: "bold",
		paddingTop: 8,
	},
}));
