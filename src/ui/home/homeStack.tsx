import React from "react";
import {
	createStackNavigator,
	StackNavigationProp,
} from "@react-navigation/stack";
import {HomeScreen} from "./home";
import {ReportScreen} from "./report";
import {EvaluationScreen} from "./evaluation";
import {FormScreen} from "./form";
import {getStr} from "../../utils/i18n";
import {ExpenditureScreen} from "./expenditure";
import {ClassroomListScreen} from "./classroomList";
import {ClassroomDetailScreen} from "./classroomDetail";
import {RouteProp} from "@react-navigation/native";
import {DormScoreScreen} from "./dormScore";
import {LibraryScreen} from "./library";
import {LibraryFloorScreen} from "./libraryFloor";
import {LibrarySectionScreen} from "./librarySection";
import {LibrarySeatScreen} from "./librarySeat";
import {PhysicalExamScreen} from "./physicalExam";
import {Platform, TouchableOpacity, View} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import themes from "../../assets/themes/themes";
import {LibraryMapScreen, LibrarySeatMapScreen} from "./libraryMap";
import {
	Library,
	LibraryFloor,
	LibrarySection,
	LibRoomRes,
} from "thu-info-lib/dist/models/home/library";
import {useColorScheme} from "react-native";
import {EmailScreen} from "./email";
import {EmailListScreen} from "./emailList";
import {LibRoomBookScreen} from "./libRoomBook";
import {LibRoomPerformBookScreen} from "./libRoomPerformBook";
import {LibRoomBookRecordScreen} from "./libRoomBookRecord";
import {WasherWebScreen} from "./washerWeb";
import {WaterScreen} from "./water";
import {LibBookRecordScreen} from "./libBookRecord";
import {SportsIdInfo} from "thu-info-lib/dist/models/home/sports";
import {SportsScreen} from "./sports";
import {SportsDetailScreen} from "./sportsDetail";
import {SportsSelectScreen} from "./sportsSelect";
import {SportsRecordScreen} from "./sportsRecord";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {GitlabHomeScreen, GitlabStarredScreen} from "./gitlabHome";
import {GitlabProjectScreen} from "./gitlabProject";
import {File, Project} from "thu-info-lib/dist/models/gitlab/gitlab";
import {GitlabTreeScreen} from "./gitlabTree";
import {GitlabCodeScreen, GitlabMarkdownScreen} from "./gitlabCode";
import {GitlabPDFScreen} from "./gitlabPDF";
import {GitlabSearchScreen} from "./gitlabSearch";
import {GitlabImageScreen} from "./gitlabImage";
import {ReservesLibWelcomeScreen} from "./reservesLibWelcome";
import {SearchResultItem} from "thu-info-lib/dist/models/home/reserves-lib";
import {ReservesLibPDFScreen} from "./reservesLibPDF";
import {BankPaymentScreen} from "./bankPayment";
import {InvoiceScreen} from "./invoice";
import {InvoicePDFScreen} from "./invoicePDF";
import {ElectricityScreen} from "./electricity";
import {EleRecordScreen} from "./eleRecord";
import {ECardScreen} from "./ecard";
import {check, PERMISSIONS, request, RESULTS} from "react-native-permissions";
import RNFS from "react-native-fs";
import Snackbar from "react-native-snackbar";
import {
	ScheduleDetailProps,
	ScheduleDetailScreen,
} from "../schedule/scheduleDetail";

export type HomeStackParamList = {
	Home: undefined;
	Report: undefined;
	Evaluation: undefined;
	Form: {name: string; url: string};
	PhysicalExam: undefined;
	Expenditure: undefined;
	ClassroomList: undefined;
	ClassroomDetail: {name: string};
	Library: undefined;
	LibraryFloor: {library: Library; dateChoice: 0 | 1};
	LibrarySection: {floor: LibraryFloor; dateChoice: 0 | 1};
	LibrarySeat: {section: LibrarySection; dateChoice: 0 | 1};
	LibraryMap: {floor: LibraryFloor; dateChoice: 0 | 1};
	LibrarySeatMap: {section: LibrarySection};
	LibBookRecord: undefined;
	LibRoomBook: undefined;
	LibRoomPerformBook: {date: string; res: LibRoomRes}; // date: yyyy-MM-dd
	LibRoomBookRecord: undefined;
	DormScore: undefined;
	Invoice: undefined;
	InvoicePDF: {base64: string; id: string};
	ReservesLibWelcome: undefined;
	ReservesLibPDF: {book: SearchResultItem};
	Email: {messageId: number};
	EmailList: undefined;
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

export type EmailRouteProp = RouteProp<HomeStackParamList, "Email">;

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

const Stack = createStackNavigator<HomeStackParamList>();

export type HomeNav = StackNavigationProp<HomeStackParamList>;

const HomeStackUI = () => {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	return (
		<Stack.Navigator>
			<Stack.Screen
				name="Home"
				component={HomeScreen}
				options={{
					title: getStr("home"),
					headerShown: false,
				}}
			/>
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
				name="Expenditure"
				component={ExpenditureScreen}
				options={{title: getStr("expenditure")}}
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
				name="Library"
				component={LibraryScreen}
				options={({navigation}) => ({
					title: getStr("library"),
					headerRight: () => (
						<TouchableOpacity
							style={{paddingHorizontal: 16, marginHorizontal: 4}}
							onPress={() => navigation.navigate("LibBookRecord")}>
							<Icon name="history" size={24} color={theme.colors.primary} />
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
							<Icon name="history" size={24} color={theme.colors.primary} />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name="LibrarySection"
				component={LibrarySectionScreen}
				options={({route, navigation}) => ({
					title: route.params.floor.zhNameTrace,
					headerRight: () => (
						<View style={{flexDirection: "row"}}>
							<TouchableOpacity
								style={{paddingHorizontal: 8, marginHorizontal: 4}}
								onPress={() => navigation.navigate("LibraryMap", route.params)}>
								<Icon name="map" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
							<TouchableOpacity
								style={{paddingRight: 16, paddingLeft: 8, marginHorizontal: 4}}
								onPress={() => navigation.navigate("LibBookRecord")}>
								<Icon name="history" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
						</View>
					),
				})}
			/>
			<Stack.Screen
				name="LibrarySeat"
				component={LibrarySeatScreen}
				options={({route, navigation}) => ({
					title: route.params.section.zhNameTrace,
					headerRight: () => (
						<View style={{flexDirection: "row"}}>
							<TouchableOpacity
								style={{paddingHorizontal: 8, marginHorizontal: 4}}
								onPress={() =>
									navigation.navigate("LibrarySeatMap", route.params)
								}>
								<Icon name="map" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
							<TouchableOpacity
								style={{paddingRight: 16, paddingLeft: 8, marginHorizontal: 4}}
								onPress={() => navigation.navigate("LibBookRecord")}>
								<Icon name="history" size={24} color={theme.colors.primary} />
							</TouchableOpacity>
						</View>
					),
				})}
			/>
			<Stack.Screen
				name="LibraryMap"
				component={LibraryMapScreen}
				options={({route}) => ({title: route.params.floor.zhNameTrace})}
			/>
			<Stack.Screen
				name="LibrarySeatMap"
				component={LibrarySeatMapScreen}
				options={({route}) => ({title: route.params.section.zhNameTrace})}
			/>
			<Stack.Screen
				name="LibBookRecord"
				component={LibBookRecordScreen}
				options={{title: getStr("libBookRecord")}}
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
							<Icon name="history" size={24} color={theme.colors.primary} />
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
							<Icon name="history" size={24} color={theme.colors.primary} />
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
							<Icon name="history" size={24} color={theme.colors.primary} />
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
							<Icon name="history" size={24} color={theme.colors.primary} />
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
				name="Email"
				component={EmailScreen}
				options={{title: getStr("email")}}
			/>
			<Stack.Screen
				name="EmailList"
				component={EmailListScreen}
				options={{title: getStr("email")}}
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
				name="ECard"
				component={ECardScreen}
				options={{title: getStr("eCard")}}
			/>
			<Stack.Screen
				name="ScheduleDetail"
				component={ScheduleDetailScreen}
				options={{title: getStr("scheduleDetail")}}
			/>
		</Stack.Navigator>
	);
};

export const HomeStackScreen = connect((state: State) => ({
	emailUnseen: state.config.emailUnseen,
}))(HomeStackUI);
