import {ScrollView, View, Text, Dimensions} from "react-native";
import React, {ReactElement} from "react";
import {connect} from "react-redux";
import {Exam, Lesson} from "../../models/schedule/schedule";
import {ScheduleNav} from "./scheduleStack";
import {State} from "../../redux/store";
import {
	primaryScheduleThunk,
	secondaryScheduleThunk,
} from "../../redux/actions/schedule";
import {Choice} from "src/redux/reducers/schedule";
import {SCHEDULE_DEL_OR_HIDE} from "../../redux/constants";
import {Schedule} from "src/components/schedule/schedule";

interface ScheduleProps {
	readonly primary: Lesson[];
	readonly secondary: Lesson[];
	readonly custom: Lesson[];
	readonly exam: Exam[];
	readonly cache: string;
	readonly primaryRefreshing: boolean;
	readonly secondaryRefreshing: boolean;
	readonly shortenMap: {[key: string]: string};
	readonly hiddenRules: Lesson[];
	readonly unitHeight: number;
	getPrimary: () => void;
	getSecondary: () => void;
	// delOrHide: DelOrHide;
	// TODO: Replace?
	navigation: ScheduleNav;
}

const ScheduleUI = (props: ScheduleProps) => {
	const timeBlockNum = 14;
	const daysInWeek = 7;
	const borderTotWidth = daysInWeek + 1;

	// TODO: let it able to be modified
	const unitHeight = 80;
	const unitWidth =
		(Dimensions.get("window").width - borderTotWidth) / (daysInWeek + 1 / 2);

	const horizontalLine = () => (
		<View style={{backgroundColor: "lightgray", height: 1}} />
	);

	const basicGrid = () => {
		let daysOfWeekList: ReactElement[] = [];
		["周一", "周二", "周三", "周四", "周五", "周六", "周日"].forEach(
			(val, ind) => {
				daysOfWeekList.push(
					<View
						style={{
							flex: 2,
							borderLeftColor: "lightgray",
							borderLeftWidth: ind ? 1 : 2,
							alignContent: "center",
							justifyContent: "center",
						}}
						key={`0-${ind + 1}`}>
						<Text style={{textAlign: "center", color: "gray"}}>{val}</Text>
					</View>,
				);
			},
		);

		let gridHead = (
			<View
				style={{
					flexDirection: "row",
					borderBottomColor: "lightgray",
					borderBottomWidth: 2,
					height: unitHeight / 2,
				}}
				key="0">
				<View style={{flex: 1}} key="0-0" />
				{daysOfWeekList}
			</View>
		);

		let basicRow = (ind: number) => {
			let blockList = [];
			blockList.push(
				<View
					style={{flex: 1, alignContent: "center", justifyContent: "center"}}
					key={`${ind}-0`}>
					<Text style={{textAlign: "center", color: "gray"}}>{ind}</Text>
				</View>,
			);
			for (let i = 0; i < daysInWeek; ++i) {
				blockList.push(
					<View
						style={{
							flex: 2,
							borderLeftColor: "lightgray",
							borderLeftWidth: i ? 1 : 2,
						}}
						key={`${ind}-${i + 1}`}
					/>,
				);
			}
			return blockList;
		};

		let rowList: ReactElement[] = [gridHead];
		for (let i = 1; i <= timeBlockNum; ++i) {
			rowList.push(
				<View
					style={{
						flex: 2,
						flexDirection: "row",
						height: unitHeight,
						borderBottomColor: "lightgray",
						borderBottomWidth: [2, 5, 7, 9, 11].indexOf(i) === -1 ? 1 : 2,
					}}
					key={`${i}`}>
					{basicRow(i)}
				</View>,
			);
		}

		return <View style={{flex: 1}}>{rowList}</View>;
	};

	// TODO: update it to add secondary
	const allSchedule = () => {
		let components: ReactElement[] = [];
		props.primary.forEach((val) => {
			components.push(
				<Schedule
					lessonInfo={val}
					gridHeight={unitHeight}
					gridWidth={unitWidth}
				/>,
			);
		});
		return components;
	};

	return (
		<ScrollView style={{flex: 1, flexDirection: "column"}}>
			{horizontalLine()}
			{basicGrid()}
			{allSchedule()}
		</ScrollView>
	);
};

export const ScheduleScreen = connect(
	(state: State) => ({
		...state.schedule,
		unitHeight:
			state.config.scheduleHeight > 10 ? state.config.scheduleHeight : 10,
	}),
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
			delOrHide: ([lesson, choice]: [Lesson, Choice]) => {
				dispatch({type: SCHEDULE_DEL_OR_HIDE, payload: [lesson, choice]});
			},
		};
	},
)(ScheduleUI);
