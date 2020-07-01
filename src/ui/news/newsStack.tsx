import React from "react";
import {createStackNavigator} from "@react-navigation/stack";
import {NewsScreen} from "./news";

const Stack = createStackNavigator();

export const NewsStackScreen = () => (
	<Stack.Navigator>
		<Stack.Screen name="动态" component={NewsScreen} />
	</Stack.Navigator>
);
