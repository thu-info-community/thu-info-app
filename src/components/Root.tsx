import React from "react";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {getStr} from "../utils/i18n";
import Icon from "react-native-vector-icons/FontAwesome";
import themes from "../assets/themes/themes";
import {
	Platform,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {HomeScreen} from "../ui/home/home";
import {NewsScreen} from "../ui/news/news";
import {NewsSlice, SourceTag} from "thu-info-lib/dist/models/news/news";
import {ScheduleScreen} from "../ui/schedule/schedule";
import {globalObjects, store} from "../redux/store";
import {saveImg} from "../utils/saveImg";
import {SettingsScreen} from "../ui/settings/settings";
import {
	createStackNavigator,
	StackNavigationProp,
} from "@react-navigation/stack";
import {
	Library,
	LibraryFloor,
	LibrarySection,
	LibRoomRes,
} from "thu-info-lib/dist/models/home/library";
import {SearchResultItem} from "thu-info-lib/dist/models/home/reserves-lib";
import {SportsIdInfo} from "thu-info-lib/dist/models/home/sports";
import {File, Project} from "thu-info-lib/dist/models/gitlab/gitlab";
import {
	ScheduleDetailProps,
	ScheduleDetailScreen,
} from "../ui/schedule/scheduleDetail";
import {ReportScreen} from "../ui/home/report";
import {EvaluationScreen} from "../ui/home/evaluation";
import {FormScreen} from "../ui/home/form";
import {PhysicalExamScreen} from "../ui/home/physicalExam";
import {ExpenditureScreen} from "../ui/home/expenditure";
import {ClassroomListScreen} from "../ui/home/classroomList";
import {ClassroomDetailScreen} from "../ui/home/classroomDetail";
import {LibraryScreen} from "../ui/home/library";
import {LibraryFloorScreen} from "../ui/home/libraryFloor";
import {LibrarySectionScreen} from "../ui/home/librarySection";
import {LibrarySeatScreen} from "../ui/home/librarySeat";
import {LibraryMapScreen, LibrarySeatMapScreen} from "../ui/home/libraryMap";
import {LibBookRecordScreen} from "../ui/home/libBookRecord";
import {LibRoomBookScreen} from "../ui/home/libRoomBook";
import {LibRoomPerformBookScreen} from "../ui/home/libRoomPerformBook";
import {LibRoomBookRecordScreen} from "../ui/home/libRoomBookRecord";
import {DormScoreScreen} from "../ui/home/dormScore";
import {InvoiceScreen} from "../ui/home/invoice";
import {InvoicePDFScreen} from "../ui/home/invoicePDF";
import {check, PERMISSIONS, request, RESULTS} from "react-native-permissions";
import RNFS from "react-native-fs";
import Snackbar from "react-native-snackbar";
import {ReservesLibWelcomeScreen} from "../ui/home/reservesLibWelcome";
import {ReservesLibPDFScreen} from "../ui/home/reservesLibPDF";
import {SportsScreen} from "../ui/home/sports";
import {SportsDetailScreen} from "../ui/home/sportsDetail";
import {SportsSelectScreen} from "../ui/home/sportsSelect";
import {SportsRecordScreen} from "../ui/home/sportsRecord";
import {BankPaymentScreen} from "../ui/home/bankPayment";
import {GitlabHomeScreen, GitlabStarredScreen} from "../ui/home/gitlabHome";
import {GitlabSearchScreen} from "../ui/home/gitlabSearch";
import {GitlabProjectScreen} from "../ui/home/gitlabProject";
import {GitlabTreeScreen} from "../ui/home/gitlabTree";
import {GitlabCodeScreen, GitlabMarkdownScreen} from "../ui/home/gitlabCode";
import {GitlabPDFScreen} from "../ui/home/gitlabPDF";
import {GitlabImageScreen} from "../ui/home/gitlabImage";
import {WaterScreen} from "../ui/home/water";
import {WasherWebScreen} from "../ui/home/washerWeb";
import {ElectricityScreen} from "../ui/home/electricity";
import {EleRecordScreen} from "../ui/home/eleRecord";
import {ECardScreen} from "../ui/home/ecard";
import {NewsDetailScreen} from "../ui/news/newsDetail";
import {ScheduleAddScreen} from "../ui/schedule/scheduleAdd";
import {ScheduleHiddenScreen} from "../ui/schedule/scheduleHidden";
import {FeedbackScreen} from "../ui/settings/feedback";
import {PopiScreen} from "../ui/settings/popi";
import {AboutScreen} from "../ui/settings/about";
import {RouteProp} from "@react-navigation/native";
import IconHomeTab from "../assets/icons/IconHomeTab";
import IconNewsTab from "../assets/icons/IconNewsTab";
import IconScheduleTab from "../assets/icons/IconScheduleTab";
import IconSettingsTab from "../assets/icons/IconSettingsTab";
import {FinanceScreen} from "../ui/home/finance";
import {DormScreen} from "../ui/home/dorm";
import IconLoseCard from "../assets/icons/IconLoseCard";
import {MyhomeLoginScreen} from "../ui/settings/myhomeLogin";
import {AccountScreen} from "../ui/settings/account";
import {ReserveScreen} from "../ui/home/reserve";
import {LibRoomCaptchaScreen} from "../ui/home/libRoomCaptcha";
import {CrHomeScreen} from "../ui/home/crHome";
import {CrCaptchaScreen} from "../ui/home/crCaptcha";
import {CrCoursePlanScreen} from "../ui/home/crCoursePlan";
import {SearchParams} from "thu-info-lib/dist/models/cr/cr";
import {CrSearchResultScreen} from "../ui/home/crSearchResult";
import IconHistory from "../assets/icons/IconHistory";
import IconLocal from "../assets/icons/IconLocal";
import {PrivacyScreen} from "../ui/settings/privacy";
import {GeneralScreen} from "../ui/settings/general";
import {LanguageScreen} from "../ui/settings/language";
import {configSet} from "../redux/actions/config";
import {DarkModeScreen} from "../ui/settings/darkMode";
import {FunctionManagementScreen} from "../ui/settings/functionManagement";

type RootTabParamList = {
	HomeTab: undefined;
	NewsTab: {source: SourceTag};
	ScheduleTab: undefined;
	SettingsTab: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const RootTabs = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	return (
		<Tab.Navigator
			screenOptions={({route}) => ({
				tabBarIcon: ({color, size}) => {
					switch (route.name) {
						case "HomeTab": {
							return <IconHomeTab size={size} color={color} />;
						}
						case "NewsTab": {
							return <IconNewsTab size={size} color={color} />;
						}
						case "ScheduleTab": {
							return <IconScheduleTab size={size} color={color} />;
						}
						case "SettingsTab": {
							return <IconSettingsTab size={size} color={color} />;
						}
					}

					return null;
				},
				tabBarActiveTintColor: theme.colors.primary,
				tabBarInactiveTintColor: "gray",
			})}
			backBehavior="initialRoute">
			<Tab.Screen
				name="HomeTab"
				component={HomeScreen}
				options={{title: getStr("home")}}
			/>
			<Tab.Screen
				name="NewsTab"
				component={NewsScreen}
				options={({route}) => ({
					title:
						route.params === undefined
							? getStr("news")
							: getStr(route.params.source),
				})}
			/>
			<Tab.Screen
				name="ScheduleTab"
				component={ScheduleScreen}
				options={({navigation}) => ({
					title: getStr("schedule"),
					headerRight: () => (
						<View style={{flexDirection: "row"}}>
							<TouchableOpacity
								style={{paddingHorizontal: 16, marginHorizontal: 4}}
								onPress={() => {
									if (
										globalObjects.scheduleViewShot !== null &&
										globalObjects.scheduleViewShot.current !== null &&
										globalObjects.scheduleViewShot.current.capture
									) {
										globalObjects.scheduleViewShot.current
											.capture()
											.then(saveImg);
									}
								}}>
								<Icon name="camera" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
							<TouchableOpacity
								style={{paddingHorizontal: 16, marginHorizontal: 4}}
								onPress={() => navigation.navigate("ScheduleHidden")}>
								<Icon name="eye-slash" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
							<TouchableOpacity
								style={{paddingHorizontal: 16, marginHorizontal: 4}}
								onPress={() => navigation.navigate("ScheduleAdd")}>
								<Icon name="plus" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
						</View>
					),
				})}
			/>
			<Tab.Screen
				name="SettingsTab"
				component={SettingsScreen}
				options={{title: getStr("settings")}}
			/>
		</Tab.Navigator>
	);
};

type HomeStackParamList = {
	Report: undefined;
	Evaluation: undefined;
	Form: {name: string; url: string};
	PhysicalExam: undefined;
	Finance: undefined;
	Expenditure: undefined;
	LoseCard: undefined;
	ClassroomList: undefined;
	ClassroomDetail: {name: string};
	CrCaptcha: undefined;
	CrHome: undefined;
	CrCoursePlan: {semesterId: string};
	CrSearchResult: {searchParams: SearchParams};
	Reserve: undefined;
	Library: undefined;
	LibraryFloor: {library: Library; dateChoice: 0 | 1};
	LibrarySection: {floor: LibraryFloor; dateChoice: 0 | 1};
	LibrarySeat: {section: LibrarySection; dateChoice: 0 | 1};
	LibraryMap: {floor: LibraryFloor; dateChoice: 0 | 1};
	LibrarySeatMap: {section: LibrarySection};
	LibBookRecord: undefined;
	LibRoomCaptcha: undefined;
	LibRoomBook: undefined;
	LibRoomPerformBook: {date: string; res: LibRoomRes}; // date: yyyy-MM-dd
	LibRoomBookRecord: undefined;
	Dorm: undefined;
	DormScore: undefined;
	Invoice: undefined;
	InvoicePDF: {base64: string; id: string};
	ReservesLibWelcome: undefined;
	ReservesLibPDF: {book: SearchResultItem};
	Qzyq: undefined;
	WasherWeb: undefined;
	Sports: undefined;
	SportsDetail: {info: SportsIdInfo; date: string};
	SportsSelect: {
		info: SportsIdInfo;
		date: string;
		phone: string;
		availableFields: {id: string; name: string; cost: number}[];
	};
	SportsRecord: undefined;
	BankPayment: undefined;
	GitLabHome: undefined;
	GitLabStar: undefined;
	GitLabSearch: undefined;
	GitLabProject: {project: Project};
	GitLabTree: {project: Project; path: string; ref: string};
	GitLabCode: {project: Project; file: File};
	GitLabMarkdown: {project: Project; file: File};
	GitLabPDF: {project: Project; file: File; cookie: string};
	GitLabImage: {project: Project; file: File};
	MyhomeLogin: undefined;
	Electricity: undefined;
	EleRecord: undefined;
	ECard: undefined;
	ScheduleDetail: ScheduleDetailProps;
};

export type FormRouteProp = RouteProp<HomeStackParamList, "Form">;
export type ClassroomDetailRouteProp = RouteProp<
	HomeStackParamList,
	"ClassroomDetail"
>;
export type CrCoursePlanRouteProp = RouteProp<
	HomeStackParamList,
	"CrCoursePlan"
>;
export type CrSearchResultRouteProp = RouteProp<
	HomeStackParamList,
	"CrSearchResult"
>;
export type LibraryMapRouteProp = RouteProp<HomeStackParamList, "LibraryMap">;
export type LibrarySeatRouteProp = RouteProp<HomeStackParamList, "LibrarySeat">;
export type LibrarySeatMapRouteProp = RouteProp<
	HomeStackParamList,
	"LibrarySeatMap"
>;
export type LibRoomPerformBookProp = RouteProp<
	HomeStackParamList,
	"LibRoomPerformBook"
>;
export type ReservesLibPDFProp = RouteProp<
	HomeStackParamList,
	"ReservesLibPDF"
>;

export type SportsDetailProp = RouteProp<HomeStackParamList, "SportsDetail">;

export type SportsSelectProp = RouteProp<HomeStackParamList, "SportsSelect">;

export type GitLabProjectProp = RouteProp<HomeStackParamList, "GitLabProject">;

export type GitLabTreeProp = RouteProp<HomeStackParamList, "GitLabTree">;

export type GitLabCodeProp = RouteProp<HomeStackParamList, "GitLabCode">;

export type GitLabMarkdownProp = RouteProp<
	HomeStackParamList,
	"GitLabMarkdown"
>;

export type GitLabPDFProp = RouteProp<HomeStackParamList, "GitLabPDF">;

export type GitLabImageProp = RouteProp<HomeStackParamList, "GitLabImage">;

type NewsStackParamList = {
	NewsDetail: {detail: NewsSlice};
};

export type NewsDetailRouteProp = RouteProp<NewsStackParamList, "NewsDetail">;

type ScheduleStackParamList = {
	ScheduleAdd: undefined;
	ScheduleHidden: undefined;
	ScheduleDetail: ScheduleDetailProps;
};

type SettingsStackParamList = {
	Account: undefined;
	FunctionManagement: undefined;
	General: undefined;
	Language: undefined;
	DarkMode: undefined;
	Privacy: undefined;
	HelpAndFeedback: undefined;
	Feedback: undefined;
	Popi: undefined;
	About: undefined;
};

export type RootStackParamList = {RootTabs: undefined} & HomeStackParamList &
	NewsStackParamList &
	ScheduleStackParamList &
	SettingsStackParamList;

const Stack = createStackNavigator<RootStackParamList>();

export type RootNav = StackNavigationProp<RootStackParamList>;

export const Root = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	return (
		<Stack.Navigator>
			{/* Root Tabs */}
			<Stack.Screen
				name="RootTabs"
				component={RootTabs}
				options={{headerShown: false}}
			/>
			{/* Home */}
			<Stack.Screen
				name="Report"
				component={ReportScreen}
				options={{title: getStr("report")}}
			/>
			<Stack.Screen
				name="Evaluation"
				component={EvaluationScreen}
				options={{title: getStr("teachingEvaluation")}}
			/>
			<Stack.Screen
				name="Form"
				component={FormScreen}
				options={({route}) => ({title: route.params.name})}
			/>
			<Stack.Screen
				name="PhysicalExam"
				component={PhysicalExamScreen}
				options={{title: getStr("physicalExam")}}
			/>
			<Stack.Screen
				name="Finance"
				component={FinanceScreen}
				options={{title: getStr("campusFinance")}}
			/>
			<Stack.Screen
				name="Expenditure"
				component={ExpenditureScreen}
				options={({navigation}) => ({
					title: getStr("expenditure"),
					headerRight: () => (
						<View style={{flexDirection: "row"}}>
							<TouchableOpacity
								style={{paddingHorizontal: 16, marginHorizontal: 4}}
								onPress={() => navigation.navigate("LoseCard")}>
								<IconLoseCard width={24} height={24} />
							</TouchableOpacity>
						</View>
					),
				})}
			/>
			<Stack.Screen
				name="ClassroomList"
				component={ClassroomListScreen}
				options={{title: getStr("classroomState")}}
			/>
			<Stack.Screen
				name="ClassroomDetail"
				component={ClassroomDetailScreen}
				options={({route}) => ({title: route.params.name})}
			/>
			<Stack.Screen
				name="CrCaptcha"
				component={CrCaptchaScreen}
				options={{title: getStr("courseRegistration")}}
			/>
			<Stack.Screen
				name="CrHome"
				component={CrHomeScreen}
				options={{title: getStr("courseRegistration")}}
			/>
			<Stack.Screen
				name="CrCoursePlan"
				component={CrCoursePlanScreen}
				options={{title: getStr("coursePlan")}}
			/>
			<Stack.Screen
				name="CrSearchResult"
				component={CrSearchResultScreen}
				options={{title: getStr("search")}}
			/>
			<Stack.Screen
				name="Reserve"
				component={ReserveScreen}
				options={{title: getStr("reservation")}}
			/>
			<Stack.Screen
				name="Library"
				component={LibraryScreen}
				options={({navigation}) => ({
					title: getStr("library"),
					headerRight: () => (
						<TouchableOpacity
							style={{paddingHorizontal: 16, marginHorizontal: 4}}
							onPress={() => navigation.navigate("LibBookRecord")}>
							<IconHistory width={24} height={24} />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name="LibraryFloor"
				component={LibraryFloorScreen}
				options={({route, navigation}) => ({
					title: route.params.library.zhName,
					headerRight: () => (
						<TouchableOpacity
							style={{paddingHorizontal: 16, marginHorizontal: 4}}
							onPress={() => navigation.navigate("LibBookRecord")}>
							<IconHistory width={24} height={24} />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name="LibrarySection"
				component={LibrarySectionScreen}
				options={({route, navigation}) => ({
					title: route.params.floor.zhName,
					headerRight: () => (
						<View style={{flexDirection: "row"}}>
							<TouchableOpacity
								style={{paddingHorizontal: 8, marginHorizontal: 4}}
								onPress={() => navigation.navigate("LibraryMap", route.params)}>
								<IconLocal width={24} height={24} />
							</TouchableOpacity>
						</View>
					),
				})}
			/>
			<Stack.Screen
				name="LibrarySeat"
				component={LibrarySeatScreen}
				options={({route, navigation}) => ({
					title: route.params.section.zhName,
					headerRight: () => (
						<View style={{flexDirection: "row"}}>
							<TouchableOpacity
								style={{paddingHorizontal: 8, marginHorizontal: 4}}
								onPress={() =>
									navigation.navigate("LibrarySeatMap", route.params)
								}>
								<IconLocal width={24} height={24} />
							</TouchableOpacity>
						</View>
					),
				})}
			/>
			<Stack.Screen
				name="LibraryMap"
				component={LibraryMapScreen}
				options={({route}) => ({title: route.params.floor.zhName})}
			/>
			<Stack.Screen
				name="LibrarySeatMap"
				component={LibrarySeatMapScreen}
				options={({route}) => ({title: route.params.section.zhName})}
			/>
			<Stack.Screen
				name="LibBookRecord"
				component={LibBookRecordScreen}
				options={{title: getStr("libBookRecord")}}
			/>
			<Stack.Screen
				name="LibRoomCaptcha"
				component={LibRoomCaptchaScreen}
				options={{title: getStr("libRoomBook")}}
			/>
			<Stack.Screen
				name="LibRoomBook"
				component={LibRoomBookScreen}
				options={({navigation}) => ({
					title: getStr("libRoomBook"),
					headerRight: () => (
						<TouchableOpacity
							style={{paddingHorizontal: 16, marginHorizontal: 4}}
							onPress={() => navigation.navigate("LibRoomBookRecord")}>
							<IconHistory width={24} height={24} />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name="LibRoomPerformBook"
				component={LibRoomPerformBookScreen}
				options={{title: getStr("libRoomBook")}}
			/>
			<Stack.Screen
				name="LibRoomBookRecord"
				component={LibRoomBookRecordScreen}
				options={{title: getStr("libRoomBookRecord")}}
			/>
			<Stack.Screen
				name="Dorm"
				component={DormScreen}
				options={{title: getStr("dorm")}}
			/>
			<Stack.Screen
				name="DormScore"
				component={DormScoreScreen}
				options={{title: getStr("dormScore")}}
			/>
			<Stack.Screen
				name="Invoice"
				component={InvoiceScreen}
				options={{title: getStr("invoice")}}
			/>
			<Stack.Screen
				name="InvoicePDF"
				component={InvoicePDFScreen}
				options={({
					route: {
						params: {base64, id},
					},
				}) => ({
					title: getStr("invoice"),
					headerRight: () => (
						<View style={{flexDirection: "row"}}>
							<TouchableOpacity
								style={{paddingHorizontal: 16, marginHorizontal: 4}}
								onPress={async () => {
									if (Platform.OS === "android") {
										const checkResult = await check(
											PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
										);
										switch (checkResult) {
											case RESULTS.DENIED: {
												const requestResult = await request(
													PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
												);
												if (requestResult !== RESULTS.GRANTED) {
													return;
												}
												break;
											}
											case RESULTS.GRANTED: {
												break;
											}
											default:
												return;
										}
									}
									const filename = `${id}.pdf`;
									const path =
										(Platform.OS === "android"
											? RNFS.DownloadDirectoryPath
											: RNFS.DocumentDirectoryPath) +
										"/" +
										filename;
									await RNFS.writeFile(path, base64, "base64");
									Snackbar.show({
										text: getStr("success"),
										duration: Snackbar.LENGTH_SHORT,
									});
								}}>
								<Icon name="download" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
						</View>
					),
				})}
			/>
			<Stack.Screen
				name="ReservesLibWelcome"
				component={ReservesLibWelcomeScreen}
				options={{title: getStr("reservesLib")}}
			/>
			<Stack.Screen
				name="ReservesLibPDF"
				component={ReservesLibPDFScreen}
				options={({route}) => ({title: route.params.book.title})}
			/>
			<Stack.Screen
				name="Sports"
				component={SportsScreen}
				options={({navigation}) => ({
					title: getStr("sportsBook"),
					headerRight: () => (
						<TouchableOpacity
							style={{paddingHorizontal: 16, marginHorizontal: 4}}
							onPress={() => navigation.navigate("SportsRecord")}>
							<IconHistory width={24} height={24} />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name="SportsDetail"
				component={SportsDetailScreen}
				options={({route, navigation}) => ({
					title: route.params.info.name + " " + route.params.date,
					headerRight: () => (
						<TouchableOpacity
							style={{paddingHorizontal: 16, marginHorizontal: 4}}
							onPress={() => navigation.navigate("SportsRecord")}>
							<IconHistory width={24} height={24} />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name="SportsSelect"
				component={SportsSelectScreen}
				options={({navigation}) => ({
					title: getStr("confirmOrder"),
					headerRight: () => (
						<TouchableOpacity
							style={{paddingHorizontal: 16, marginHorizontal: 4}}
							onPress={() => navigation.navigate("SportsRecord")}>
							<IconHistory width={24} height={24} />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name="SportsRecord"
				component={SportsRecordScreen}
				options={{title: getStr("sportsRecord")}}
			/>
			<Stack.Screen
				name="BankPayment"
				component={BankPaymentScreen}
				options={{title: getStr("bankPayment")}}
			/>
			<Stack.Screen
				name="GitLabHome"
				component={GitlabHomeScreen}
				options={({navigation}) => ({
					title: getStr("gitLab"),
					headerRight: () => (
						<View style={{flexDirection: "row"}}>
							<TouchableOpacity
								style={{paddingHorizontal: 16, marginHorizontal: 4}}
								onPress={() => navigation.navigate("GitLabStar")}>
								<Icon name="star-o" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
							<TouchableOpacity
								style={{paddingRight: 16, paddingLeft: 8, marginHorizontal: 4}}
								onPress={() => navigation.navigate("GitLabSearch")}>
								<Icon name="search" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
						</View>
					),
				})}
			/>
			<Stack.Screen
				name="GitLabStar"
				component={GitlabStarredScreen}
				options={{title: getStr("gitLabStar")}}
			/>
			<Stack.Screen
				name="GitLabSearch"
				component={GitlabSearchScreen}
				options={{title: getStr("gitLab")}}
			/>
			<Stack.Screen
				name="GitLabProject"
				component={GitlabProjectScreen}
				options={({route}) => ({title: route.params.project.name})}
			/>
			<Stack.Screen
				name="GitLabTree"
				component={GitlabTreeScreen}
				options={({route}) => ({
					title: route.params.path
						? route.params.path
						: getStr("gitlabViewCode"),
				})}
			/>
			<Stack.Screen
				name="GitLabCode"
				component={GitlabCodeScreen}
				options={({route}) => ({title: route.params.file.name})}
			/>
			<Stack.Screen
				name="GitLabMarkdown"
				component={GitlabMarkdownScreen}
				options={({
					route: {
						params: {project, file},
					},
					navigation,
				}) => ({
					title: file.name,
					headerRight: () => (
						<View style={{flexDirection: "row"}}>
							<TouchableOpacity
								style={{paddingHorizontal: 16, marginHorizontal: 4}}
								onPress={() =>
									navigation.navigate("GitLabCode", {project, file})
								}>
								<Icon name="code" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
						</View>
					),
				})}
			/>
			<Stack.Screen
				name="GitLabPDF"
				component={GitlabPDFScreen}
				options={({route}) => ({title: route.params.file.name})}
			/>
			<Stack.Screen
				name="GitLabImage"
				component={GitlabImageScreen}
				options={({route}) => ({title: route.params.file.name})}
			/>
			<Stack.Screen
				name="Qzyq"
				component={WaterScreen}
				options={{title: getStr("qzyq")}}
			/>
			<Stack.Screen
				name="WasherWeb"
				component={WasherWebScreen}
				options={{title: getStr("washer")}}
			/>
			<Stack.Screen
				name="MyhomeLogin"
				component={MyhomeLoginScreen}
				options={{title: getStr("myhomeLogin")}}
			/>
			<Stack.Screen
				name="Electricity"
				component={ElectricityScreen}
				options={{title: getStr("electricity")}}
			/>
			<Stack.Screen
				name="EleRecord"
				component={EleRecordScreen}
				options={{title: getStr("eleRecord")}}
			/>
			<Stack.Screen
				name="LoseCard"
				component={ECardScreen}
				options={{title: getStr("loseCard")}}
			/>
			{/* News */}
			<Stack.Screen
				name="NewsDetail"
				component={NewsDetailScreen}
				options={{title: getStr("newsDetail")}}
			/>
			{/* Schedule */}
			<Stack.Screen
				name="ScheduleAdd"
				component={ScheduleAddScreen}
				options={{title: getStr("scheduleAddCustom")}}
			/>
			<Stack.Screen
				name="ScheduleHidden"
				component={ScheduleHiddenScreen}
				options={{title: getStr("scheduleHidden")}}
			/>
			<Stack.Screen
				name="ScheduleDetail"
				component={ScheduleDetailScreen}
				options={{title: getStr("scheduleDetail")}}
			/>
			{/* Settings */}
			<Stack.Screen
				name="Account"
				component={AccountScreen}
				options={{title: getStr("accountAndSecurity")}}
			/>
			<Stack.Screen
				name="FunctionManagement"
				component={FunctionManagementScreen}
				options={{title: getStr("functionManagement")}}
			/>
			<Stack.Screen
				name="General"
				component={GeneralScreen}
				options={{title: getStr("general")}}
			/>
			<Stack.Screen
				name="Language"
				component={LanguageScreen}
				options={({navigation}) => ({
					title: getStr("language"),
					headerRight: () => (
						<TouchableOpacity
							style={{paddingHorizontal: 16, margin: 4}}
							onPress={() => {
								navigation.pop();
								store.dispatch(
									configSet("language", globalObjects.languageSelected),
								);
								Snackbar.show({
									text: getStr("restartToApply"),
									duration: Snackbar.LENGTH_SHORT,
								});
							}}>
							<Text style={{color: theme.colors.primaryLight, fontSize: 16}}>
								{getStr("done")}
							</Text>
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name="DarkMode"
				component={DarkModeScreen}
				options={{title: getStr("darkMode")}}
			/>
			<Stack.Screen
				name="Privacy"
				component={PrivacyScreen}
				options={{title: getStr("privacy")}}
			/>
			<Stack.Screen
				name="HelpAndFeedback"
				component={FeedbackScreen}
				options={{title: getStr("helpAndFeedback")}}
			/>
			<Stack.Screen
				name="Popi"
				component={PopiScreen}
				options={{title: getStr("popi")}}
			/>
			<Stack.Screen
				name="About"
				component={AboutScreen}
				options={{title: getStr("about")}}
			/>
		</Stack.Navigator>
	);
};
