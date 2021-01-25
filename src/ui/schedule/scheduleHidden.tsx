/* eslint-disable no-mixed-spaces-and-tabs */
import {connect} from "react-redux";
import React from "react";
import {FlatList, Text, TouchableOpacity, View, Dimensions} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import {State} from "../../redux/store";
import {Schedule, TimeBlock} from "../../models/schedule/schedule";
import {SCHEDULE_REMOVE_HIDDEN_RULE} from "../../redux/constants";
import {getStr} from "../../utils/i18n";

const dayOfWeekChar = ["", "一", "二", "三", "四", "五", "六", "日"];

const ScheduleHiddenUI = ({
	baseSchedule,
	removeRule,
}: {
	baseSchedule: Schedule[];
	removeRule: (name: string, rule: TimeBlock) => void;
}) => {
	let screenHeight = Dimensions.get("window");

	const getData = () => {
		let list = baseSchedule
			.filter((val) => val.delOrHideTime.length !== 0)
			.map((val) =>
				val.delOrHideTime.map((block) => ({name: val.name, time: block})),
			);
		if (list.length === 0) {
			return [];
		} else {
			return list.reduce((total, array) => total.concat(array));
		}
	};

	return (
		<FlatList
			data={getData()}
			renderItem={({item}) => (
				<View style={{flexDirection: "row", padding: 6, alignItems: "center"}}>
					<Text style={{flex: 1, marginHorizontal: 5, fontSize: 15}}>
						{item.time.week === 0
							? `${getStr("schedulePrefixAll")} ${item.name}`
							: `${
									item.time.week === -1
										? getStr("schedulePrefixRepeat")
										: getStr("schedulePrefixOncePrefix") +
										  item.time.week +
										  getStr("schedulePrefixOnceSuffix")
							  } ${item.name} 周${dayOfWeekChar[item.time.dayOfWeek]} [${
									item.time.begin
							  }, ${item.time.end}]`}
					</Text>
					<TouchableOpacity
						style={{padding: 5, marginHorizontal: 6}}
						onPress={() => {
							removeRule(item.name, item.time);
						}}>
						<Icon name="trash-o" size={18} color="black" />
					</TouchableOpacity>
				</View>
			)}
			ListEmptyComponent={
				<View
					style={{
						margin: 15,
						height: screenHeight.height * 0.7,
						justifyContent: "center",
						alignItems: "center",
					}}>
					<Text
						style={{
							fontSize: 18,
							fontWeight: "bold",
							alignSelf: "center",
							margin: 5,
						}}>
						{getStr("noHiddenLesson")}
					</Text>
					<Text
						style={{
							fontSize: 16,
							alignSelf: "center",
							color: "gray",
							margin: 5,
						}}>
						{getStr("hiddenLessonTip")}
					</Text>
				</View>
			}
			style={{
				padding: 5,
			}}
			keyExtractor={(item) =>
				`${item.name}.${item.time.week}.${item.time.dayOfWeek}.[${item.time.begin}-${item.time.end}]`
			}
		/>
	);
};

export const ScheduleHiddenScreen = connect(
	(state: State) => ({
		baseSchedule: state.schedule.baseSchedule,
	}),
	(dispatch) => ({
		removeRule: (name: string, rule: TimeBlock) =>
			dispatch({type: SCHEDULE_REMOVE_HIDDEN_RULE, payload: [name, rule]}),
	}),
)(ScheduleHiddenUI);
