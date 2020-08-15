import {HomeStackScreen} from "../ui/home/homeStack";
import {NewsStackScreen} from "../ui/news/newsStack";
import React, {useContext, useEffect} from "react";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {connect} from "react-redux";
import {fullNameThunk} from "../redux/actions/basics";
import {getTicket} from "../network/core";
import {ScheduleStackScreen} from "../ui/schedule/scheduleStack";
import {getStr} from "../utils/i18n";
import Icon from "react-native-vector-icons/FontAwesome";
import themes from "../assets/themes/themes";
import {ThemeContext} from "../assets/themes/context";

interface RootProps {
	getFullName: () => void;
}

const Tab = createBottomTabNavigator();

const RootComponent = (props: RootProps) => {
	const theme = themes[useContext(ThemeContext)];

	useEffect(() => {
		// Things that should be done only once upon logged in

		props.getFullName();

		getTicket(792).then(() => console.log("Ticket 792 get."));
		getTicket(824).then(() => console.log("Ticket 824 get."));
		getTicket(2005).then(() => console.log("Ticket 2005 get."));
		getTicket(-1).then(() => console.log("Ticket -1 get."));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
					}

					return <Icon name={iconName || ""} size={size} color={color} />;
				},
			})}
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
		</Tab.Navigator>
	);
};

export const Root = connect(undefined, (dispatch) => {
	return {
		getFullName: () => {
			// @ts-ignore
			dispatch(fullNameThunk());
		},
	};
})(RootComponent);
