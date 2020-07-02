import React from "react";
import {createStackNavigator} from "@react-navigation/stack";
import {HomeScreen} from "./home";
import {ReportScreen} from "./report";
import {getStr} from "../../utils/i18n";

const Stack = createStackNavigator();

export const HomeStackScreen = () => (
	<Stack.Navigator>
		<Stack.Screen name={getStr("home")} component={HomeScreen} />
		<Stack.Screen name={getStr("report")} component={ReportScreen} />
	</Stack.Navigator>
);
