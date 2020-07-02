import React from "react";
import {
	createStackNavigator,
	StackNavigationProp,
} from "@react-navigation/stack";
import {HomeScreen} from "./home";
import {ReportScreen} from "./report";
import {getStr} from "../../utils/i18n";

type HomeStackParamList = {
	Home: undefined;
	Report: undefined;
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
	</Stack.Navigator>
);
