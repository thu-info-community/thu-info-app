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

type HomeStackParamList = {
	Home: undefined;
	Report: undefined;
	Evaluation: undefined;
	Form: {name: string; url: string};
	Expenditure: undefined;
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
		<Stack.Screen
			name="Expenditure"
			component={ExpenditureScreen}
			options={{title: getStr("expenditure")}}
		/>
	</Stack.Navigator>
);
