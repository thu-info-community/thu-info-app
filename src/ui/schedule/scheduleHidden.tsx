/* eslint-disable no-mixed-spaces-and-tabs */
import {connect} from "react-redux";
import React from "react";
import {FlatList, Text, TouchableOpacity, View, Dimensions} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import {State} from "../../redux/store";
import {Lesson} from "../../models/schedule/schedule";
import {SCHEDULE_REMOVE_HIDDEN_RULE} from "../../redux/constants";
import {getStr} from "../../utils/i18n";

const ScheduleHiddenUI = ({
	rules,
	removeRule,
}: {
	rules: Lesson[];
	removeRule: (rule: number) => void;
}) => {
	let screenHeight = Dimensions.get("window");

	return (
		<FlatList
			data={rules}
			renderItem={({item}) => (
				<View style={{flexDirection: "row", padding: 6, alignItems: "center"}}>
					<Text style={{flex: 1, marginHorizontal: 5, fontSize: 15}}>
						{item.week === -1
							? `${getStr("schedulePrefixAll")} ${item.title}`
							: `${
									item.week === 0
										? getStr("schedulePrefixRepeat")
										: getStr("schedulePrefixOncePrefix") +
										  item.week +
										  getStr("schedulePrefixOnceSuffix")
							  } ${item.title} ${getStr("dayOfWeek")[item.dayOfWeek]} [${
									item.begin
							  }, ${item.end}]`}
					</Text>
					<TouchableOpacity
						style={{padding: 5, marginHorizontal: 6}}
						onPress={() => removeRule(item)}>
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
				`${item.title}.${item.week}.${item.dayOfWeek}.[${item.begin}-${item.end}]`
			}
		/>
	);
};

export const ScheduleHiddenScreen = connect(
	(state: State) => {
		return {
			rules: state.schedule.hiddenRules,
		};
	},
	(dispatch) => {
		return {
			removeRule: (rule: Lesson) =>
				dispatch({type: SCHEDULE_REMOVE_HIDDEN_RULE, payload: rule}),
		};
	},
)(ScheduleHiddenUI);
