import React from "react";
import {createStackNavigator} from "@react-navigation/stack";
import {HomeScreen} from "./home";
import {ReportScreen} from "./report";

const Stack = createStackNavigator();

export const HomeStackScreen = () => (
	<Stack.Navigator>
		<Stack.Screen name="主页" component={HomeScreen} />
		<Stack.Screen name="成绩单" component={ReportScreen} />
	</Stack.Navigator>
);
