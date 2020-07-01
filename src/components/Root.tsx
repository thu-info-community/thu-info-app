import {HomeStackScreen} from "../ui/home/homeStack";
import {NewsStackScreen} from "../ui/news/newsStack";
import React, {useEffect, useState} from "react";
import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import {connect} from "react-redux";
import {State} from "../redux/store";
import {fullNameThunk} from "../redux/actions/basics";
import {defaultFullNameState} from "../redux/defaults";
import Snackbar from "react-native-snackbar";
import {getTicket} from "../network/core";
import {ScheduleStackScreen} from "../ui/schedule/scheduleStack";

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

			// Things that should be done only once upon logged in

			// Important network operations
			getTicket(792).then(() => console.log("Ticket 792 get."));
			getTicket(824).then(() => console.log("Ticket 824 get."));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [firstTime]);

	// In production, the following part shall be removed as it damages
	// user experience.
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
			<Tab.Screen name="主页" component={HomeStackScreen} />
			<Tab.Screen name="动态" component={NewsStackScreen} />
			<Tab.Screen name="计划" component={ScheduleStackScreen} />
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
