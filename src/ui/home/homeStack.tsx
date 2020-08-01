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
import {Form} from "src/models/home/assessment";

type HomeStackParamList = {
	Home: undefined;
	Report: undefined;
	Evaluation: undefined;
	Form: {name: string; form: Form};
};

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
	</Stack.Navigator>
);
