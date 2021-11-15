import React, {useEffect, useState} from "react";
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
import {Alert, TouchableOpacity, View} from "react-native";
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
import {helper, State} from "../../redux/store";

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
export type EmailRouteProp = RouteProp<HomeStackParamList, "Email">;

export type SportsDetailProp = RouteProp<HomeStackParamList, "SportsDetail">;

export type SportsSelectProp = RouteProp<HomeStackParamList, "SportsSelect">;

const Stack = createStackNavigator<HomeStackParamList>();

export type HomeNav = StackNavigationProp<HomeStackParamList>;

const HomeStackUI = ({emailUnseen}: {emailUnseen: number}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	const [countdown, setCountdown] = useState<string[]>([]);
	useEffect(() => {
		helper.getCountdown().then(setCountdown);
	}, []);

	return (
		<Stack.Navigator>
			<Stack.Screen
				name="Home"
				component={HomeScreen}
				options={({navigation}) => ({
					title: getStr("home"),
					headerRight: () => (
						<View style={{flexDirection: "row"}}>
							{countdown.length > 0 && (
								<TouchableOpacity
									style={{paddingHorizontal: 16, marginHorizontal: 4}}
									onPress={() =>
										Alert.alert(getStr("countdown"), countdown.join("\n"))
									}>
									<Icon name="bell" size={24} color={theme.colors.primary} />
								</TouchableOpacity>
							)}
							<TouchableOpacity
								style={{paddingHorizontal: 16, marginHorizontal: 4}}
								onPress={() => navigation.navigate("EmailList")}>
								<Icon
									name={emailUnseen > 0 ? "envelope" : "envelope-o"}
									size={24}
									color={theme.colors.primary}
								/>
							</TouchableOpacity>
						</View>
					),
				})}
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
		</Stack.Navigator>
	);
};

export const HomeStackScreen = connect((state: State) => ({
	emailUnseen: state.config.emailUnseen,
}))(HomeStackUI);
