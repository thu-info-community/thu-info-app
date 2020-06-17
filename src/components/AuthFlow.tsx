import React from "react";
import {createStackNavigator} from "@react-navigation/stack";
import {connect} from "react-redux";
import {LoginStatus} from "../redux/states/auth";
import {LoginScreen} from "../ui/login/login";
import {State} from "../redux/store";
import {Root} from "./Root";

interface AuthFlowProps {
	status: LoginStatus;
}

const Stack = createStackNavigator();

const AuthFlowComponent = (props: AuthFlowProps) =>
	props.status === LoginStatus.LoggedIn ? (
		<Root />
	) : (
		<Stack.Navigator headerMode="none">
			<Stack.Screen name="登录" component={LoginScreen} />
		</Stack.Navigator>
	);

export const AuthFlow = connect((state: State) => {
	return {status: state.auth.status};
})(AuthFlowComponent);
