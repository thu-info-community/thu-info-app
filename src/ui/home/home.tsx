import {
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import React, {ReactElement} from "react";
import {RootNav} from "../../components/Root";
import IconReport from "../../assets/icons/IconReport";
import {HomeIcon} from "../../components/home/icon";
import IconExpenditure from "../../assets/icons/IconExpenditure";
import IconFinance from "../../assets/icons/IconFinance";
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
import IconLibRoom from "../../assets/icons/IconLibRoom";
import themes from "../../assets/themes/themes";
import {useDispatch, useSelector} from "react-redux";
import {currState, helper, State} from "../../redux/store";
import {top5Update} from "../../redux/slices/top5";
import IconDormScore from "../../assets/icons/IconDormScore";
import {
	Schedule,
	ScheduleType,
} from "thu-info-lib/dist/models/schedule/schedule";
import dayjs from "dayjs";
import md5 from "md5";
import {ScheduleDetailProps} from "../schedule/scheduleDetail";
import {LibraryReservationCard} from "./library";
import {
	setActiveLibBookRecord,
	setActiveSportsReservationRecord,
} from "../../redux/slices/reservation";
import IconDorm from "../../assets/icons/IconDorm";
import IconCr from "../../assets/icons/IconCr";
import IconLocal from "../../assets/icons/IconLocal";
import IconReserve from "../../assets/icons/IconReserve";
import IconPhysicalExam from "../../assets/icons/IconPhysicalExam";
import {configSet} from "../../redux/slices/config";
import {SportsReservationCard} from "./sports";
import {addUsageStat, FunctionType} from "../../utils/webApi";
import {useNavigation} from "@react-navigation/native";
import {SafeAreaView} from "react-native-safe-area-context";
import {setCrTimetable} from "../../redux/slices/timetable";

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
				<View
					style={style.functionSectionContent}
					testID={"homeFunctions-" + title}>
					{children}
				</View>
			</View>
		</View>
	);
};

const beginTimeZh = [
	"",
	"上午 8:00",
	"上午 8:50",
	"上午 9:50",
	"上午10:40",
	"上午11:30",
	"下午 1:30",
	"下午 2:20",
	"下午 3:20",
	"下午 4:10",
	"下午 5:05",
	"下午 5:55",
	"下午 7:20",
	"下午 8:10",
	"下午 9:00",
];

const endTimeZh = [
	"",
	"上午 8:45",
	"上午 9:35",
	"上午10:35",
	"上午11:25",
	"下午12:15",
	"下午 2:15",
	"下午 3:05",
	"下午 4:05",
	"下午 4:55",
	"下午 5:50",
	"下午 6:40",
	"下午 8:05",
	"下午 8:55",
	"下午 9:45",
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
	from: string;
	to: string;
	color: string;
	navProps?: ScheduleDetailProps;
}

const HomeSchedule = ({schedule}: {schedule: ScheduleViewModel}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const navigation = useNavigation<RootNav>();
	return (
		<TouchableOpacity
			disabled={schedule.navProps === undefined}
			onPress={() => {
				schedule.navProps &&
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
					<View style={{flex: 1, flexDirection: "row-reverse"}}>
						<Text
							style={{
								alignSelf: "center",
								textAlign: "right",
								color: theme.colors.fontB0,
								fontFamily: getLocale() === zh ? "monospace" : "",
							}}>
							{schedule.from}
						</Text>
						<View style={{flex: 1}}>
							<Text
								style={{
									position: "absolute",
									alignSelf: "center",
									left: 0,
									right: 0,
									fontWeight: "bold",
									fontSize: 16,
									color: theme.colors.fontB0,
								}}
								numberOfLines={1}>
								{schedule.name}
							</Text>
						</View>
					</View>
					<View style={{flex: 1, flexDirection: "row-reverse"}}>
						<Text
							style={{
								alignSelf: "center",
								textAlign: "right",
								color: theme.colors.fontB2,
								fontFamily: getLocale() === zh ? "monospace" : "",
							}}>
							{schedule.to}
						</Text>
						<View style={{flex: 1}}>
							<Text
								style={{
									position: "absolute",
									alignSelf: "center",
									left: 0,
									right: 0,
									fontWeight: "bold",
									color: theme.colors.fontB2,
								}}
								numberOfLines={1}>
								{schedule.location}
							</Text>
						</View>
					</View>
				</View>
			</View>
		</TouchableOpacity>
	);
};

export const HomeReservationSection = () => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	return (
		<View style={style.SectionContainer}>
			<Text style={style.SectionTitle}>{getStr("reservation")}</Text>
			<LibraryReservationCard />
			<View style={{height: 8}} />
			<SportsReservationCard />
		</View>
	);
};

export const HomeScheduleSection = () => {
	const firstDay = useSelector((s: State) => s.config.firstDay);
	const baseSchedule = useSelector((s: State) => s.schedule.baseSchedule);
	const shortenMap = useSelector((s: State) => s.schedule.shortenMap);
	const crTimetable = useSelector((s: State) => s.timetable.crTimetable);
	const now = dayjs();
	const today = now.day() === 0 ? 7 : now.day();
	const tomorrow = today + 1;
	const week = Math.floor(now.diff(firstDay) / 604800000) + 1;
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
		// dayOfWeek use 8 to specify Monday of next week
		let _week = week;
		if (dayOfWeek === 8) {
			_week += 1;
			dayOfWeek = 1;
		}
		const a: (ScheduleViewModel & {begin: number; end: number})[] = [];
		for (const s of schedules) {
			for (const ss of s.activeTime.base) {
				if (ss.activeWeeks.includes(_week)) {
					if (ss.dayOfWeek === dayOfWeek) {
						const from =
							getStr("mark") === "CH"
								? beginTimeZh[ss.begin]
								: beginTimeEn[ss.begin];
						const to =
							getStr("mark") === "CH" ? endTimeZh[ss.end] : endTimeEn[ss.end];

						if (s.type === ScheduleType.CUSTOM) {
							a.push({
								name: shortenMap[s.name] ?? s.name.slice(6),
								location: s.location,
								from,
								to,
								begin: ss.begin,
								end: ss.end,
								color: getColor(s.name),
								navProps: {
									name: s.name,
									location: s.location,
									week: _week,
									dayOfWeek: today,
									begin: ss.begin,
									end: ss.end,
									alias: shortenMap[s.name] ?? "",
									type: s.type,
								},
							});
						} else {
							a.push({
								name: shortenMap[s.name] ?? s.name,
								location: s.location,
								from,
								to,
								begin: ss.begin,
								end: ss.end,
								color: getColor(s.name),
								navProps: {
									name: s.name,
									location: s.location,
									week: _week,
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
		a.sort((x, y) => x.begin - y.begin);
		return a;
	};
	const todaySchedules = selectSchedule(baseSchedule, today);
	const tomorrowSchedules = selectSchedule(baseSchedule, tomorrow);

	const themeName = useColorScheme();
	const theme = themes(themeName);
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

	const activeTimetables = crTimetable.filter(
		(timetable) =>
			(helper.graduate() && timetable.graduate) ||
			(!helper.graduate() && timetable.undergraduate),
	);
	const activeEvents = activeTimetables
		.flatMap(({events}) => events)
		.filter((event) => {
			const begin = dayjs(event.begin);
			const end = dayjs(event.end);
			return now.isBefore(end) && now.isAfter(begin.add(-14, "day"));
		});

	return (
		<View style={style.SectionContainer}>
			<Text style={style.SectionTitle}>{getStr("schedulePreview")}</Text>
			<View style={style.SectionContentContainer}>
				<Text style={style.scheduleSectionContentPrimaryTitle}>
					{getLocale() === zh
						? `${now.month() + 1}月${now.date()}日 ${dayZh[today]}`
						: `${dayEn[today]} ${now.month() + 1}/${now.date()}`}
				</Text>
				{todaySchedules.length > 0 ? (
					todaySchedules.map((x) => <HomeSchedule key={x.name} schedule={x} />)
				) : (
					<Text style={{color: theme.colors.text, marginTop: 8}}>
						{getStr("noScheduleToday")}
					</Text>
				)}
				{tomorrowSchedules.length > 0 && (
					<Text style={style.scheduleSectionContentSecondaryTitle}>
						{getStr("scheduleTomorrow")}
					</Text>
				)}
				{tomorrowSchedules.map((x) => (
					<HomeSchedule key={x.name} schedule={x} />
				))}
				<Text style={style.scheduleSectionContentPrimaryTitle}>
					{getStr("countdown")}
				</Text>
				{activeEvents.length > 0 ? (
					activeEvents.map((e) => (
						<HomeSchedule
							schedule={{
								name: e.stage,
								location: "",
								from: e.begin,
								to: e.end,
								color: getColor(e.stage),
							}}
							key={e.stage + e.begin + e.end}
						/>
					))
				) : (
					<Text style={{color: theme.colors.text, marginTop: 8}}>
						{getStr("noCountdown")}
					</Text>
				)}
			</View>
		</View>
	);
};

export type HomeFunction =
	| "report"
	| "physicalExam"
	| "teachingEvaluation"
	| "gitLab"
	| "classroomState"
	| "reserve"
	| "cr"
	| "library"
	| "libRoomBook"
	| "reservesLib"
	| "expenditure"
	| "finance"
	| "sportsBook"
	| "bankPayment"
	| "invoice"
	| "campusMap"
	| "qzyq"
	| "washer"
	| "electricity"
	| "dormitory"
	| "dormScore";

const subFunctionLocked = () => {
	const s = currState();
	const currTime = Date.now();
	const lastTime = s.config.exitTimestamp ?? 0;
	const numMinutes = (currTime - lastTime) / 1000 / 60;
	return (
		numMinutes > (s.config.appSecretLockMinutes ?? 0) &&
		s.config.subFunctionUnlocked === false
	);
};

const getHomeFunctions = (
	navigation: RootNav,
	updateTop5: (func: HomeFunction) => void,
): ReactElement[] => [
	<HomeIcon
		key="report"
		title="report"
		onPress={() => {
			addUsageStat(FunctionType.Report);
			updateTop5("report");
			if (
				currState().config.verifyPasswordBeforeEnterReport &&
				subFunctionLocked()
			) {
				navigation.navigate("DigitalPassword", {
					action: "verify",
					target: "Report",
				});
			} else {
				navigation.navigate("Report");
			}
		}}>
		<IconReport width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="physicalExam"
		title="physicalExam"
		onPress={() => {
			addUsageStat(FunctionType.PhysicalExam);
			updateTop5("physicalExam");
			if (
				currState().config.verifyPasswordBeforeEnterPhysicalExam &&
				subFunctionLocked()
			) {
				navigation.navigate("DigitalPassword", {
					action: "verify",
					target: "PhysicalExam",
				});
			} else {
				navigation.navigate("PhysicalExam");
			}
		}}>
		<IconPhysicalExam width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="teachingEvaluation"
		title="teachingEvaluation"
		onPress={() => {
			addUsageStat(FunctionType.TeachingEvaluation);
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
			addUsageStat(FunctionType.Classrooms);
			updateTop5("classroomState");
			navigation.navigate("ClassroomList");
		}}>
		<IconClassroom width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="reserve"
		title="reservation"
		onPress={() => {
			navigation.navigate("Reserve");
		}}>
		<IconReserve width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="cr"
		title="courseRegistration"
		onPress={() => {
			updateTop5("cr");
			navigation.navigate("CrHome");
		}}>
		<IconCr width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="library"
		title="library"
		onPress={() => {
			addUsageStat(FunctionType.Library);
			updateTop5("library");
			navigation.navigate("Library");
		}}>
		<IconLibrary width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="libRoomBook"
		title="libRoomBook"
		onPress={() => {
			addUsageStat(FunctionType.PrivateRooms);
			updateTop5("libRoomBook");
			navigation.navigate("LibRoomSelect");
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
			addUsageStat(FunctionType.Expenditures);
			updateTop5("expenditure");
			if (
				currState().config.verifyPasswordBeforeEnterFinance &&
				subFunctionLocked()
			) {
				navigation.navigate("DigitalPassword", {
					action: "verify",
					target: "Expenditure",
				});
			} else {
				navigation.navigate("Expenditure");
			}
		}}>
		<IconExpenditure width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="finance"
		title="campusFinance"
		onPress={() => {
			if (
				currState().config.verifyPasswordBeforeEnterFinance &&
				subFunctionLocked()
			) {
				navigation.navigate("DigitalPassword", {
					action: "verify",
					target: "Finance",
				});
			} else {
				navigation.navigate("Finance");
			}
		}}>
		<IconFinance width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="sportsBook"
		title="sportsBook"
		onPress={() => {
			addUsageStat(FunctionType.GymnasiumReg);
			updateTop5("sportsBook");
			navigation.navigate("Sports");
		}}>
		<IconSports width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="bankPayment"
		title="bankPayment"
		onPress={() => {
			addUsageStat(FunctionType.Bank);
			updateTop5("bankPayment");
			if (
				currState().config.verifyPasswordBeforeEnterFinance &&
				subFunctionLocked()
			) {
				navigation.navigate("DigitalPassword", {
					action: "verify",
					target: "BankPayment",
				});
			} else {
				navigation.navigate("BankPayment");
			}
		}}>
		<IconBankPayment width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="invoice"
		title="invoice"
		onPress={() => {
			addUsageStat(FunctionType.Invoice);
			updateTop5("invoice");
			if (
				currState().config.verifyPasswordBeforeEnterFinance &&
				subFunctionLocked()
			) {
				navigation.navigate("DigitalPassword", {
					action: "verify",
					target: "Invoice",
				});
			} else {
				navigation.navigate("Invoice");
			}
		}}>
		<IconInvoice width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="campusMap"
		title="campusMap"
		onPress={() => {
			updateTop5("campusMap");
			navigation.navigate("CampusMap");
		}}>
		<IconLocal width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="qzyq"
		title="qzyq"
		onPress={() => {
			addUsageStat(FunctionType.QZYQ);
			updateTop5("qzyq");
			navigation.navigate("Qzyq", {ticketNumber: 0});
		}}>
		<IconWater width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="washer"
		title="washer"
		onPress={() => {
			addUsageStat(FunctionType.WasherInfo);
			updateTop5("washer");
			navigation.navigate("WasherWeb");
		}}>
		<IconWasher width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="electricity"
		title="electricity"
		onPress={() => {
			addUsageStat(FunctionType.Electricity);
			updateTop5("electricity");
			navigation.navigate("Electricity");
		}}>
		<IconEleRecharge width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="dormScore"
		title="dormScore"
		onPress={() => {
			addUsageStat(FunctionType.DormScore);
			updateTop5("dormScore");
			navigation.navigate("DormScore");
		}}>
		<IconDormScore width={iconSize} height={iconSize} />
	</HomeIcon>,
	<HomeIcon
		key="dormitory"
		title="dorm"
		onPress={() => {
			navigation.navigate("Dorm");
		}}>
		<IconDorm width={iconSize} height={iconSize} />
	</HomeIcon>,
];

export const HomeScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const dispatch = useDispatch();
	const dark = useSelector((s: State) => s.config.darkMode);
	const darkModeHook = dark || themeName === "dark";

	const top5Functions = useSelector((s: State) => s.top5.top5Functions);
	const disabledList: HomeFunction[] | undefined = useSelector(
		(state: State) => state.config.homeFunctionDisabled,
	);
	if (!disabledList) {
		dispatch(configSet({key: "homeFunctionDisabled", value: []}));
	}
	const homeFunctions = getHomeFunctions(navigation, (func) =>
		dispatch(top5Update(func)),
	);
	const top5 = top5Functions.map((x) => homeFunctions.find((y) => y.key === x));
	let needToShowFunctionNames: HomeFunction[] = [];
	["physicalExam", "teachingEvaluation", "report", "classroomState"].forEach(
		(i) => {
			if (!(disabledList ?? []).includes(i as HomeFunction)) {
				needToShowFunctionNames.push(i as HomeFunction);
			}
		},
	);
	if (
		!["library", "sportsBook", "libRoomBook"].every((i) =>
			(disabledList ?? []).includes(i as HomeFunction),
		)
	) {
		// not all reserve functions are disabled
		needToShowFunctionNames.push("reserve");
	}
	if (
		!["expenditure", "bankPayment", "invoice"].every((i) =>
			(disabledList ?? []).includes(i as HomeFunction),
		)
	) {
		needToShowFunctionNames.push("finance");
	}
	if (
		!["washer", "qzyq", "dormScore", "electricity"].every((i) =>
			(disabledList ?? []).includes(i as HomeFunction),
		)
	) {
		needToShowFunctionNames.push("dormitory");
	}

	const top5Filtered = top5.filter(
		(f) => !(disabledList ?? []).includes((f as any).key),
	);

	const needToShowFunctions = needToShowFunctionNames.map((x) =>
		homeFunctions.find((y) => y.key === x),
	);

	React.useEffect(() => {
		helper
			.appStartUp()
			.then(({bookingRecords, sportsReservationRecords, crTimetable}) => {
				dispatch(setActiveLibBookRecord(bookingRecords));
				dispatch(setActiveSportsReservationRecord(sportsReservationRecords));
				dispatch(setCrTimetable(crTimetable));
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<SafeAreaView style={{flex: 1}}>
			<ScrollView
				style={{
					backgroundColor: theme.colors.themeBackground,
				}}
				key={String(darkModeHook)}>
				<HomeFunctionSection title="recentlyUsedFunction">
					{top5Filtered.length === 0 ? (
						<View style={{flex: 1, marginTop: 32, alignItems: "center"}}>
							<Text style={{color: theme.colors.text}}>
								{getStr("recentUseHint")}
							</Text>
						</View>
					) : (
						top5Filtered
					)}
				</HomeFunctionSection>
				<HomeReservationSection />
				<HomeScheduleSection />
				<HomeFunctionSection title="allFunction">
					{needToShowFunctions}
				</HomeFunctionSection>
				<View style={{height: 12}} />
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = themedStyles((theme) => ({
	SectionContainer: {
		marginHorizontal: 12,
	},
	SectionContentContainer: {
		backgroundColor: theme.colors.contentBackground,
		shadowColor: "grey",
		borderRadius: 20,
		paddingHorizontal: 12,
		paddingTop: 8,
		paddingBottom: 16,
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
	reservationSectionContainer: {
		paddingHorizontal: 24,
		paddingVertical: 20,
		alignItems: "center",
		justifyContent: "center",
	},
}));
