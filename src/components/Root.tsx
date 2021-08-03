import {HomeStackScreen} from "../ui/home/homeStack";
import {NewsStackScreen} from "../ui/news/newsStack";
import React from "react";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {ScheduleStackScreen} from "../ui/schedule/scheduleStack";
import {getStr} from "../utils/i18n";
import Icon from "react-native-vector-icons/FontAwesome";
import themes from "../assets/themes/themes";
import {SettingStackScreen} from "../ui/settings/settingsStack";
import {useColorScheme} from "react-native";

const Tab = createBottomTabNavigator();

export const Root = () => {
	const theme = themes(useColorScheme());

	return (
		<Tab.Navigator
			screenOptions={({route}) => ({
				tabBarIcon: ({color, size}) => {
					let iconName;

					switch (route.name) {
						case "HomeTab": {
							iconName = "home";
							break;
						}
						case "NewsTab": {
							iconName = "newspaper-o";
							break;
						}
						case "ScheduleTab": {
							iconName = "table";
							break;
						}
						case "SettingsTab": {
							iconName = "cogs";
							break;
						}
					}

					return <Icon name={iconName || ""} size={size} color={color} />;
				},
				tabBarActiveTintColor: theme.colors.primary,
				tabBarInactiveTintColor: "gray",
				headerShown: false,
			})}
			backBehavior="initialRoute">
			<Tab.Screen
				name="HomeTab"
				component={HomeStackScreen}
				options={{title: getStr("home")}}
			/>
			<Tab.Screen
				name="NewsTab"
				component={NewsStackScreen}
				options={{title: getStr("news")}}
			/>
			<Tab.Screen
				name="ScheduleTab"
				component={ScheduleStackScreen}
				options={{title: getStr("schedule")}}
			/>
			<Tab.Screen
				name="SettingsTab"
				component={SettingStackScreen}
				options={{title: getStr("settings")}}
			/>
		</Tab.Navigator>
	);
};
