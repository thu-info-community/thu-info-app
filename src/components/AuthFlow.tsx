import React, {useEffect} from "react";
import {
	createStackNavigator,
	StackNavigationProp,
} from "@react-navigation/stack";
import {connect} from "react-redux";
import {LoginStatus} from "../redux/states/auth";
import {LoginScreen} from "../ui/login/login";
import {currState, State, store} from "../redux/store";
import {Root} from "./Root";
import {FeedbackScreen} from "../ui/settings/feedback";
import {getStr} from "../utils/i18n";
import {PopiScreen} from "../ui/settings/popi";
import {checkBroadcast, checkUpdate} from "../utils/checkUpdate";
import {DigitalPasswordScreen} from "../ui/settings/digitalPassword";
import {Alert} from "react-native";
import {configSet} from "../redux/actions/config";

interface AuthFlowProps {
	readonly status: LoginStatus;
	readonly appLocked: boolean | undefined;
}

type LoginStackParamList = {
	Login: undefined;
	HelpAndFeedback: undefined;
	Popi: undefined;
};

const Stack = createStackNavigator<LoginStackParamList>();

export type LoginNav = StackNavigationProp<LoginStackParamList>;

const AuthFlowComponent = (props: AuthFlowProps) => {
	useEffect(() => {
		checkUpdate();
		checkBroadcast();
		if (currState().config.beta3Notified !== true) {
			Alert.alert(
				"公测提示",
				"公测版虽已排除大部分问题，但并非稳定版。\n参与公测即表示您自愿接受软件错误导致的潜在风险。\n如有问题请及时反馈。",
				[
					{
						text: "确定",
						onPress: () => store.dispatch(configSet("beta3Notified", true)),
					},
				],
				{cancelable: false},
			);
		}
	}, []);

	return props.appLocked === true ? (
		<DigitalPasswordScreen
			navigation={undefined}
			// @ts-ignore
			route={{params: {action: "verify"}}}
		/>
	) : props.status === LoginStatus.LoggedIn ? (
		<Root />
	) : (
		<Stack.Navigator screenOptions={{headerShown: false}}>
			<Stack.Screen name="Login" component={LoginScreen} />
			<Stack.Screen
				name="HelpAndFeedback"
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
	return {status: state.auth.status, appLocked: state.config.appLocked};
})(AuthFlowComponent);
