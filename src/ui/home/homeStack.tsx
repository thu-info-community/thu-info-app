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
import {WentuScreen} from "./wentu";
import {DormScoreScreen} from "./dormScore";
import {ConfigureDormScreen} from "./configureDorm";
import {LibraryScreen} from "./library";

type HomeStackParamList = {
	Home: undefined;
	Report: undefined;
	Evaluation: undefined;
	Form: {name: string; url: string};
	Expenditure: undefined;
	ClassroomList: undefined;
	ClassroomDetail: {name: string};
	Wentu: undefined;
	Library: undefined;
	DormScore: undefined;
	ConfigureDorm: {callback: () => any};
};

export type FormRouteProp = RouteProp<HomeStackParamList, "Form">;
export type ClassroomDetailRouteProp = RouteProp<
	HomeStackParamList,
	"ClassroomDetail"
>;
export type ConfigureDormRouteProp = RouteProp<
	HomeStackParamList,
	"ConfigureDorm"
>;

const Stack = createStackNavigator<HomeStackParamList>();

export type HomeNav = StackNavigationProp<HomeStackParamList>;

export const HomeStackScreen = () => (
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
			name="Wentu"
			component={WentuScreen}
			options={{title: getStr("wentu")}}
		/>
		<Stack.Screen
			name="Library"
			component={LibraryScreen}
			options={{title: getStr("library")}}
		/>
		<Stack.Screen
			name="DormScore"
			component={DormScoreScreen}
			options={{title: getStr("dormScore")}}
		/>
		<Stack.Screen
			name="ConfigureDorm"
			component={ConfigureDormScreen}
			options={{title: getStr("configureDorm")}}
		/>
	</Stack.Navigator>
);
