import React, {useContext} from "react";
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
import {Library, LibraryFloor, LibrarySection} from "../../models/home/library";
import {LibraryFloorScreen} from "./libraryFloor";
import {LibrarySectionScreen} from "./librarySection";
import {LibrarySeatScreen} from "./librarySeat";
import {PhysicalExamScreen} from "./physicalExam";
import {JoggingScreen} from "./jogging";
import {HoleListScreen} from "./holeList";
import {HoleDetailScreen} from "./holeDetail";
import {HoleTitleCard} from "../../models/home/hole";
import {HolePublishScreen} from "./holePublish";
import {TouchableOpacity} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";
import {LibraryMapScreen} from "./libraryMap";
import {HoleImageScreen} from "./holeImage";

export type HomeStackParamList = {
	Home: undefined;
	Report: undefined;
	Evaluation: undefined;
	Form: {name: string; url: string};
	PhysicalExam: undefined;
	Jogging: undefined;
	Expenditure: undefined;
	ClassroomList: undefined;
	ClassroomDetail: {name: string};
	Library: undefined;
	LibraryFloor: {library: Library; dateChoice: 0 | 1};
	LibrarySection: {floor: LibraryFloor; dateChoice: 0 | 1};
	LibrarySeat: {section: LibrarySection; dateChoice: 0 | 1};
	LibraryMap: {floor: LibraryFloor; dateChoice: 0 | 1};
	DormScore: undefined;
	HoleList: undefined;
	HoleDetail: HoleTitleCard | {pid: number; lazy: true};
	HolePublish: undefined;
	HoleImage: {url: string};
};

export type FormRouteProp = RouteProp<HomeStackParamList, "Form">;
export type ClassroomDetailRouteProp = RouteProp<
	HomeStackParamList,
	"ClassroomDetail"
>;
export type LibraryMapRouteProp = RouteProp<HomeStackParamList, "LibraryMap">;
export type LibrarySeatRouteProp = RouteProp<HomeStackParamList, "LibrarySeat">;
export type HoleDetailRouteProp = RouteProp<HomeStackParamList, "HoleDetail">;
export type HoleImageRouteProp = RouteProp<HomeStackParamList, "HoleImage">;

const Stack = createStackNavigator<HomeStackParamList>();

export type HomeNav = StackNavigationProp<HomeStackParamList>;

export const HomeStackScreen = () => {
	const themeName = useContext(ThemeContext);
	const theme = themes[themeName];

	return (
		<Stack.Navigator>
			<Stack.Screen
				name="Home"
				component={HomeScreen}
				options={{title: getStr("home")}}
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
				name="Jogging"
				component={JoggingScreen}
				options={{title: getStr("jogging")}}
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
				options={{title: getStr("library")}}
			/>
			<Stack.Screen
				name="LibraryFloor"
				component={LibraryFloorScreen}
				options={({route}) => ({title: route.params.library.zhName})}
			/>
			<Stack.Screen
				name="LibrarySection"
				component={LibrarySectionScreen}
				options={({route, navigation}) => ({
					title: route.params.floor.zhNameTrace,
					headerRight: () => (
						<TouchableOpacity
							style={{paddingHorizontal: 16, marginHorizontal: 4}}
							onPress={() => navigation.navigate("LibraryMap", route.params)}>
							<Icon name="search" size={24} color={theme.colors.primary} />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name="LibrarySeat"
				component={LibrarySeatScreen}
				options={({route}) => ({title: route.params.section.zhNameTrace})}
			/>
			<Stack.Screen
				name="LibraryMap"
				component={LibraryMapScreen}
				options={({route}) => ({title: route.params.floor.zhNameTrace})}
			/>
			<Stack.Screen
				name="DormScore"
				component={DormScoreScreen}
				options={{title: getStr("dormScore")}}
			/>
			<Stack.Screen
				name="HoleList"
				component={HoleListScreen}
				options={({navigation}: {navigation: HomeNav}) => ({
					title: getStr("hole"),
					headerRight: () => (
						<TouchableOpacity
							style={{paddingHorizontal: 16, marginHorizontal: 4}}
							onPress={() => navigation.navigate("HolePublish")}>
							<Icon name="plus" size={24} color={theme.colors.primary} />
						</TouchableOpacity>
					),
				})}
			/>
			<Stack.Screen
				name="HoleDetail"
				component={HoleDetailScreen}
				options={{title: getStr("holeDetail")}}
			/>
			<Stack.Screen
				name="HolePublish"
				component={HolePublishScreen}
				options={{title: getStr("holePublish")}}
			/>
			<Stack.Screen
				name="HoleImage"
				component={HoleImageScreen}
				options={{title: getStr("holeImage")}}
			/>
		</Stack.Navigator>
	);
};
