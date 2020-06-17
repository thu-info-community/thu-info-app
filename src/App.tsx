import React, {useEffect} from "react";
import {createStackNavigator} from "@react-navigation/stack";
import {NavigationContainer} from "@react-navigation/native";
import {connect, Provider} from "react-redux";
import {LoginStatus} from "./redux/states/auth";
import {store} from "./redux/store";
import {LoginScreen} from "./ui/login/login";
import {HomeScreen} from "./ui/home/home";
import {State} from "./redux/store";
import Snackbar from "react-native-snackbar";
import {fullNameThunk} from "./redux/actions/basics";
import {defaultFullNameState} from "./redux/defaults";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {NewsScreen} from "./ui/news/news";
import {ScheduleScreen} from "./ui/schedule/schedule";

interface RootProps {
	status: LoginStatus;
	fullName: string;
	getFullName: () => void;
}

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const CoreRouting = (props: RootProps) => {
	const {status, fullName, getFullName} = props;

	// Things that should be done once the user has logged in
	useEffect(() => {
		if (status === LoginStatus.LoggedIn) {
			getFullName();
		}
	}, [status, getFullName]);

	// Other effect hooks
	useEffect(() => {
		if (fullName !== defaultFullNameState) {
			Snackbar.show({
				text: `你好，${fullName}！`,
				duration: Snackbar.LENGTH_SHORT,
			});
		}
	}, [fullName]);

	return (
		<NavigationContainer>
			{props.status === LoginStatus.LoggedIn ? (
				<Tab.Navigator>
					<Tab.Screen name="主页" component={HomeScreen} />
					<Tab.Screen name="动态" component={NewsScreen} />
					<Tab.Screen name="计划" component={ScheduleScreen} />
				</Tab.Navigator>
			) : (
				<Stack.Navigator headerMode="none">
					<Stack.Screen name="登录" component={LoginScreen} />
				</Stack.Navigator>
			)}
		</NavigationContainer>
	);
};

const Root = connect(
	(state: State) => {
		return {status: state.auth.status, fullName: state.fullName};
	},
	(dispatch) => {
		return {
			getFullName: () => {
				// @ts-ignore
				dispatch(fullNameThunk());
			},
		};
	},
)(CoreRouting);

export const App = () => (
	<Provider store={store}>
		<Root />
	</Provider>
);
