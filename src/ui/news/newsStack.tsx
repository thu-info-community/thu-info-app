import React from "react";
import {createStackNavigator} from "@react-navigation/stack";
import {NewsScreen} from "./news";
import {getStr} from "../../utils/i18n";

const Stack = createStackNavigator();

export const NewsStackScreen = () => (
	<Stack.Navigator>
		<Stack.Screen name={getStr("news")} component={NewsScreen} />
	</Stack.Navigator>
);
