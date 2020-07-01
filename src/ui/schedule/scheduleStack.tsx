import React from "react";
import {createStackNavigator} from "@react-navigation/stack";
import {ScheduleScreen} from "./schedule";

const Stack = createStackNavigator();

export const ScheduleStackScreen = () => (
	<Stack.Navigator>
		<Stack.Screen name="计划" component={ScheduleScreen} />
	</Stack.Navigator>
);
