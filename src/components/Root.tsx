import {HomeScreen} from "../ui/home/home";
import {NewsScreen} from "../ui/news/news";
import {ScheduleScreen} from "../ui/schedule/schedule";
import React, {useEffect, useState} from "react";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {connect} from "react-redux";
import {State} from "../redux/store";
import {fullNameThunk} from "../redux/actions/basics";
import {defaultFullNameState} from "../redux/defaults";
import Snackbar from "react-native-snackbar";

interface RootProps {
	fullName: string;
	getFullName: () => void;
}

const Tab = createBottomTabNavigator();

const RootComponent = (props: RootProps) => {
	const {fullName} = props;
	const [firstTime, setFirstTime] = useState(true);

	useEffect(() => {
		if (firstTime) {
			setFirstTime(false);
			props.getFullName();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [firstTime]);

	useEffect(() => {
		if (fullName !== defaultFullNameState) {
			Snackbar.show({
				text: `欢迎，${fullName}！`,
				duration: Snackbar.LENGTH_SHORT,
			});
		}
	}, [fullName]);

	return (
		<Tab.Navigator>
			<Tab.Screen name="主页" component={HomeScreen} />
			<Tab.Screen name="动态" component={NewsScreen} />
			<Tab.Screen name="计划" component={ScheduleScreen} />
		</Tab.Navigator>
	);
};

export const Root = connect(
	(state: State) => {
		return {fullName: state.fullName};
	},
	(dispatch) => {
		return {
			getFullName: () => {
				// @ts-ignore
				dispatch(fullNameThunk());
			},
		};
	},
)(RootComponent);
