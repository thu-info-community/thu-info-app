import {
	createStackNavigator,
	StackNavigationProp,
} from "@react-navigation/stack";
import {SettingsScreen} from "./settings";
import {getStr} from "../../utils/i18n";
import React from "react";
import {FeedbackScreen} from "./feedback";
import {PopiScreen} from "./popi";
import {ScheduleSettingsScreen} from "./scheduleSettings";
import {AboutScreen} from "./about";

type SettingsStackParamList = {
	Settings: undefined;
	Feedback: undefined;
	Popi: undefined;
	ScheduleSettings: undefined;
	About: undefined;
};

const Stack = createStackNavigator<SettingsStackParamList>();

export type SettingsNav = StackNavigationProp<SettingsStackParamList>;

export const SettingStackScreen = () => (
	<Stack.Navigator>
		<Stack.Screen
			name="Settings"
			component={SettingsScreen}
			options={{title: getStr("settings")}}
		/>
		<Stack.Screen
			name="Feedback"
			component={FeedbackScreen}
			options={{title: getStr("feedback")}}
		/>
		<Stack.Screen
			name="Popi"
			component={PopiScreen}
			options={{title: getStr("popi")}}
		/>
		<Stack.Screen
			name="ScheduleSettings"
			component={ScheduleSettingsScreen}
			options={{title: getStr("scheduleSettings")}}
		/>
		<Stack.Screen
			name="About"
			component={AboutScreen}
			options={{title: getStr("about")}}
		/>
	</Stack.Navigator>
);
