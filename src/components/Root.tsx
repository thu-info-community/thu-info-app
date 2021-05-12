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
						case "Home": {
							iconName = "home";
							break;
						}
						case "News": {
							iconName = "newspaper-o";
							break;
						}
						case "Schedule": {
							iconName = "table";
							break;
						}
						case "Settings": {
							iconName = "cogs";
							break;
						}
					}

					return <Icon name={iconName || ""} size={size} color={color} />;
				},
			})}
			backBehavior="initialRoute"
			tabBarOptions={{
				activeTintColor: theme.colors.primary,
				inactiveTintColor: "gray",
			}}>
			<Tab.Screen
				name="Home"
				component={HomeStackScreen}
				options={{title: getStr("home")}}
			/>
			<Tab.Screen
				name="News"
				component={NewsStackScreen}
				options={{title: getStr("news")}}
			/>
			<Tab.Screen
				name="Schedule"
				component={ScheduleStackScreen}
				options={{title: getStr("schedule")}}
			/>
			<Tab.Screen
				name="Settings"
				component={SettingStackScreen}
				options={{title: getStr("settings")}}
			/>
		</Tab.Navigator>
	);
};
