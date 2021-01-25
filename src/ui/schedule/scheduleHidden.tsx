import {connect} from "react-redux";
import React from "react";
import {
	FlatList,
	Text,
	TouchableOpacity,
	View,
	Dimensions,
	Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import {State} from "../../redux/store";
import {
	getOverlappedBlock,
	Schedule,
	ScheduleType,
	TimeBlock,
} from "../../models/schedule/schedule";
import {
	SCHEDULE_DEL_OR_HIDE,
	SCHEDULE_REMOVE_HIDDEN_RULE,
} from "../../redux/constants";
import {getStr} from "../../utils/i18n";
import {Choice} from "src/redux/reducers/schedule";

const dayOfWeekChar = ["", "一", "二", "三", "四", "五", "六", "日"];

const ScheduleHiddenUI = ({
	baseSchedule,
	removeRule,
	delOrHide,
}: {
	baseSchedule: Schedule[];
	removeRule: (name: string, rule: TimeBlock) => void;
	delOrHide: (title: string, block: TimeBlock, choice: Choice) => void;
}) => {
	let screenHeight = Dimensions.get("window");

	const getData = () => {
		let list = baseSchedule
			.filter((val) => val.delOrHideTime.length !== 0)
			.map((val) =>
				val.delOrHideTime.map((block) => ({
					name: val.name,
					time: block,
					type: val.type,
				})),
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
										: "[第" + item.time.week + "周]"
									// eslint-disable-next-line no-mixed-spaces-and-tabs
							  } ${item.name.substr(
									item.type === ScheduleType.CUSTOM ? 6 : 0,
									// eslint-disable-next-line no-mixed-spaces-and-tabs
							  )} 周${dayOfWeekChar[item.time.dayOfWeek]} [${
									item.time.begin
									// eslint-disable-next-line no-mixed-spaces-and-tabs
							  }, ${item.time.end}]`}
					</Text>
					<TouchableOpacity
						style={{padding: 5, marginHorizontal: 6}}
						onPress={() => {
							let overlapList: [
								TimeBlock,
								string,
								boolean,
							][] = getOverlappedBlock(
								{
									name: item.name,
									location: "",
									activeTime: [item.time],
									delOrHideTime: [],
									delOrHideDetail: [],
									type: ScheduleType.PRIMARY,
								},
								baseSchedule,
							);
							if (overlapList.length) {
								Alert.alert(
									"计划冲突",
									"您要恢复的计划与下列计划相冲突：\n\n" +
										overlapList
											.map(
												(val) =>
													"「" +
													val[1].substr(val[2] ? 6 : 0) +
													"」\n第" +
													val[0].week +
													"周 周" +
													dayOfWeekChar[val[0].dayOfWeek] +
													" 第" +
													val[0].begin +
													(val[0].begin === val[0].end
														? ""
														: " ~ " + val[0].end) +
													"节",
											)
											.join("\n\n") +
										"\n\n点击“确认”则会覆盖已有计划（如果自定义所有时间段均被覆盖，这个计划会被删除），点击“取消”放弃恢复计划",
									[
										{
											text: "确认",
											onPress: () => {
												removeRule(item.name, item.time);
												overlapList.forEach((val) => {
													delOrHide(val[1], val[0], Choice.ONCE);
												});
											},
										},
										{
											text: "取消",
										},
									],
								);
							} else {
								removeRule(item.name, item.time);
							}
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
		delOrHide: (title: string, block: TimeBlock, choice: Choice) => {
			dispatch({type: SCHEDULE_DEL_OR_HIDE, payload: [title, block, choice]});
		},
	}),
)(ScheduleHiddenUI);
