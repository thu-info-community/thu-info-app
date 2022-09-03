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
import {State} from "../../redux/store";
import {
	getOverlappedBlock,
	Schedule,
	ScheduleType,
	TimeSlice,
} from "thu-info-lib/dist/models/schedule/schedule";
import {
	scheduleDelOrHideAction,
	scheduleRemoveHiddenRuleAction,
} from "../../redux/actions/schedule";
import {getStr} from "../../utils/i18n";
import {Choice} from "src/redux/reducers/schedule";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";

const ScheduleHiddenUI = ({
	baseSchedule,
	removeRule,
	delOrHide,
}: {
	baseSchedule: Schedule[];
	removeRule: (name: string, rule: TimeSlice) => void;
	delOrHide: (title: string, block: TimeSlice, choice: Choice) => void;
}) => {
	let screenHeight = Dimensions.get("window");
	const themeName = useColorScheme();
	const theme = themes(themeName);

	const getData = () => {
		let res: {
			name: string;
			type: ScheduleType;
			time: TimeSlice;
			weekPrefix: string;
		}[] = [];
		baseSchedule
			.filter((val) => val.delOrHideTime.base.length !== 0)
			.forEach((val) => {
				val.delOrHideTime.base.forEach((slice) => {
					const rangeList: [number, number][] = [];
					slice.activeWeeks.sort((a, b) => a - b);
					rangeList.push([slice.activeWeeks[0], -1]);
					slice.activeWeeks.forEach((week, ind) => {
						if (!ind || week === slice.activeWeeks[ind - 1] + 1) {
							return;
						}

						rangeList[rangeList.length - 1][1] = slice.activeWeeks[ind - 1];
						rangeList.push([week, -1]);
					});
					rangeList[rangeList.length - 1][1] =
						slice.activeWeeks[slice.activeWeeks.length - 1];

					let resStr = "";
					if (
						rangeList.length === 1 &&
						rangeList[0][0] === 1 &&
						rangeList[0][1] === 16
					) {
						resStr += getStr("schedulePrefixRepeat");
					} else {
						resStr += getStr("schedulePrefixOncePrefix");
						resStr += rangeList
							.map((range) =>
								range[0] === range[1]
									? `${range[0]}`
									: `${range[0]} ~ ${range[1]}`,
							)
							.join(", ");
						resStr += getStr("schedulePrefixOnceSuffix");
					}
					res.push({
						name: val.name,
						type: val.type,
						time: slice,
						weekPrefix: resStr,
					});
				});
			});
		return res;
	};

	return (
		<FlatList
			data={getData()}
			renderItem={({item}) => (
				<View style={{flexDirection: "row", padding: 6, alignItems: "center"}}>
					<Text
						style={{
							flex: 1,
							marginHorizontal: 5,
							fontSize: 15,
							color: theme.colors.text,
						}}>
						{`${item.weekPrefix} ${item.name.substr(
							item.type === ScheduleType.CUSTOM ? 6 : 0,
						)} ${getStr("dayOfWeek")[item.time.dayOfWeek]} [${
							item.time.begin
						}, ${item.time.end}]`}
					</Text>
					<TouchableOpacity
						style={{padding: 5, marginHorizontal: 6}}
						onPress={() => {
							let overlapList: [string, ScheduleType, TimeSlice][] =
								getOverlappedBlock(
									{
										name: item.name,
										location: "",
										activeTime: {base: [item.time]},
										delOrHideTime: {base: []},
										type: ScheduleType.PRIMARY,
									},
									baseSchedule,
								);
							if (overlapList.length) {
								Alert.alert(
									getStr("scheduleConflict"),
									getStr("unhideIntro") +
										overlapList
											.map(
												(val) =>
													"「" +
													val[0].substr(
														val[1] === ScheduleType.CUSTOM ? 6 : 0,
													) +
													"」\n" +
													getStr("weekNumPrefix") +
													val[2].activeWeeks[0] +
													getStr("weekNumSuffix") +
													" " +
													getStr("dayOfWeek")[val[2].dayOfWeek] +
													" " +
													getStr("periodNumPrefix") +
													val[2].begin +
													(val[2].begin === val[2].end
														? ""
														: " ~ " + val[2].end) +
													getStr("periodNumSuffix"),
											)
											.join("\n\n") +
										getStr("unhideText"),
									[
										{
											text: getStr("confirm"),
											onPress: () => {
												removeRule(item.name, item.time);
												overlapList.forEach((val) => {
													delOrHide(val[0], val[2], Choice.ONCE);
												});
											},
										},
										{
											text: getStr("cancel"),
										},
									],
								);
							} else {
								removeRule(item.name, item.time);
							}
						}}>
						{/* <Icon name="trash-o" size={18} color={theme.colors.text} /> */}
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
							color: theme.colors.text,
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
				`${item.name}.${item.time.dayOfWeek}.[${item.time.begin}-${item.time.end}]`
			}
		/>
	);
};

export const ScheduleHiddenScreen = connect(
	(state: State) => ({
		baseSchedule: state.schedule.baseSchedule,
	}),
	(dispatch) => ({
		removeRule: (name: string, rule: TimeSlice) =>
			dispatch(scheduleRemoveHiddenRuleAction([name, rule])),
		delOrHide: (title: string, block: TimeSlice, choice: Choice) => {
			dispatch(scheduleDelOrHideAction([title, block, choice]));
		},
	}),
)(ScheduleHiddenUI);
