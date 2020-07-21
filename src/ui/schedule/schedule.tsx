import {Button, StyleSheet, Text, View} from "react-native";
import React from "react";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {primaryScheduleThunk} from "../../redux/actions/schedule";
import {Lesson} from "../../models/schedule/schedule";

interface ScheduleProps {
	readonly primary: Lesson[];
	getSchedule: () => void;
}

const ScheduleUI = (props: ScheduleProps) => {
	const foo = () => {
		if (props.primary.length === 0) {
			console.log(2333);
			props.getSchedule();
		} else {
			console.log(props.primary);
		}
	};

	return (
		<View style={styles.center}>
			<Text>这是计划。</Text>
			<Button title={"2333"} onPress={foo} />
		</View>
	);
};

const styles = StyleSheet.create({
	center: {flex: 1, alignItems: "center", justifyContent: "center"},
});

export const ScheduleScreen = connect(
	(state: State) => state.schedule,
	(dispatch) => {
		return {
			getSchedule: () => {
				// @ts-ignore
				dispatch(primaryScheduleThunk());
			},
		};
	},
)(ScheduleUI);
