import {Button, StyleSheet, Text, View} from "react-native";
import React from "react";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {
	primaryScheduleThunk,
	secondaryScheduleThunk,
} from "../../redux/actions/schedule";
import {Exam, Lesson} from "../../models/schedule/schedule";

interface ScheduleProps {
	readonly primary: Lesson[];
	readonly secondary: Lesson[];
	readonly exam: Exam[];
	getPrimary: () => void;
	getSecondary: () => void;
}

const ScheduleUI = (props: ScheduleProps) => {
	const foo = () => {
		if (props.primary.length === 0) {
			props.getPrimary();
		} else {
			console.log(props.primary);
		}
		if (props.secondary.length === 0) {
			props.getSecondary();
		} else {
			console.log(props.secondary);
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
			getPrimary: () => {
				// @ts-ignore
				dispatch(primaryScheduleThunk());
			},
			getSecondary: () => {
				// @ts-ignore
				dispatch(secondaryScheduleThunk());
			},
		};
	},
)(ScheduleUI);
