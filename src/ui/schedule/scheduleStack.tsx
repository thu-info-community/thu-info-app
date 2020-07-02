import React from "react";
import {
	createStackNavigator,
	StackNavigationProp,
} from "@react-navigation/stack";
import {ScheduleScreen} from "./schedule";
import {getStr} from "../../utils/i18n";

type ScheduleStackParamList = {
	Schedule: undefined;
};

const Stack = createStackNavigator<ScheduleStackParamList>();

export type ScheduleNav = StackNavigationProp<ScheduleStackParamList>;

export const ScheduleStackScreen = () => (
	<Stack.Navigator>
		<Stack.Screen
			name="Schedule"
			component={ScheduleScreen}
			options={{title: getStr("schedule")}}
		/>
	</Stack.Navigator>
);
