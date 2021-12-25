import React, {useEffect} from "react";
import {
	createStackNavigator,
	StackNavigationProp,
} from "@react-navigation/stack";
import {connect} from "react-redux";
import {LoginStatus} from "../redux/states/auth";
import {LoginScreen} from "../ui/login/login";
import {State} from "../redux/store";
import {Root} from "./Root";
import {FeedbackScreen} from "../ui/settings/feedback";
import {getStr} from "../utils/i18n";
import {PopiScreen} from "../ui/settings/popi";
import {checkBroadcast, checkUpdate} from "../utils/checkUpdate";
import {leanCloudInit} from "../utils/leanCloud";

interface AuthFlowProps {
	readonly status: LoginStatus;
}

type LoginStackParamList = {
	Login: undefined;
	Feedback: undefined;
	Popi: undefined;
};

const Stack = createStackNavigator<LoginStackParamList>();

export type LoginNav = StackNavigationProp<LoginStackParamList>;

const AuthFlowComponent = (props: AuthFlowProps) => {
	useEffect(() => {
		checkUpdate();
		checkBroadcast();
		leanCloudInit();
	}, []);

	return props.status === LoginStatus.LoggedIn ? (
		<Root />
	) : (
		<Stack.Navigator screenOptions={{headerShown: false}}>
			<Stack.Screen name="Login" component={LoginScreen} />
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
		</Stack.Navigator>
	);
};

export const AuthFlow = connect((state: State) => {
	return {status: state.auth.status};
})(AuthFlowComponent);
