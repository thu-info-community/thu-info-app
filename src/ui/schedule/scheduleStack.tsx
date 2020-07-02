import React from "react";
import {createStackNavigator} from "@react-navigation/stack";
import {ScheduleScreen} from "./schedule";
import {getStr} from "../../utils/i18n";

const Stack = createStackNavigator();

export const ScheduleStackScreen = () => (
	<Stack.Navigator>
		<Stack.Screen name={getStr("schedule")} component={ScheduleScreen} />
	</Stack.Navigator>
);
