import React from "react";
import {
	createStackNavigator,
	StackNavigationProp,
} from "@react-navigation/stack";
import {NewsScreen} from "./news";
import {getStr} from "../../utils/i18n";
import {NewsDetailScreen} from "./newsDetail";

type NewsStackParamList = {
	News: undefined;
	NewsDetail: {url: string};
};

const Stack = createStackNavigator<NewsStackParamList>();

export type NewsNav = StackNavigationProp<NewsStackParamList>;

export const NewsStackScreen = () => (
	<Stack.Navigator>
		<Stack.Screen
			name="News"
			component={NewsScreen}
			options={{title: getStr("news")}}
		/>
		<Stack.Screen
			name="NewsDetail"
			component={NewsDetailScreen}
			options={{title: "AAA"}}
		/>
	</Stack.Navigator>
);
