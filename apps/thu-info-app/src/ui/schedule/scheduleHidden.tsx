import {scheduleConflicts} from "../../redux/scheduleData";
import {deleteScheduleOccurrences} from "../../redux/scheduleOperations";
import {useDispatch, useSelector, useStore} from "react-redux";
import {FlatList, Text, TouchableOpacity, View, Alert} from "react-native";
import {State, helper} from "../../redux/store";
import {
	ScheduleType,
	TimeSlice,
	getBeginPeriod,
	getEndPeriod,
	getWeekFromTime,
	isInSemester,
} from "@thu-info/lib/src/models/schedule/schedule";
import {getStr} from "../../utils/i18n";
import {
	Choice,
	scheduleRemoveHiddenRule,
} from "../../redux/slices/schedule";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import {EmptyState, Separator} from "../../components/subpage/rows";
import {
	roundedListContent,
	spacing,
} from "../../components/subpage/tokens";

export const ScheduleHiddenScreen = () => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const baseSchedule = useSelector((s: State) => s.schedule.baseSchedule);
	const {firstDay, weekCount} = useSelector((s: State) => s.config);
	const reduxStore = useStore<State>();
	const dispatch = useDispatch();

	const getData = () => {
		let res: {
			localId: string;
			name: string;
			type: ScheduleType;
			time: TimeSlice;
			weekPrefix: string;
		}[] = [];
		baseSchedule
			.filter((val) => val.delOrHideTime.base.length !== 0)
			.forEach((val) => {
				val.delOrHideTime.base.forEach((e) => {
					if (!isInSemester(e.beginTime, firstDay, weekCount)) { return; }
					const week = getWeekFromTime(e.beginTime, firstDay);
					const resStr = getStr("weekNumPrefix") + week + getStr("weekNumSuffix");
					res.push({
						localId: val.localId,
						name: val.name,
						type: val.type,
						time: e,
						weekPrefix: resStr,
					});
				});
			});
		return res;
	};

	const data = getData();

	return (
		<FlatList
			data={data}
			style={{flex: 1, margin: spacing.md}}
			contentContainerStyle={roundedListContent(colors, data.length > 0)}
			renderItem={({item, index}) => (
				<>
					{index > 0 && <Separator style={{marginHorizontal: 0}} />}
					<View style={{flexDirection: "row", alignItems: "center"}}>
						<Text
							style={{
								flex: 1,
								marginHorizontal: 5,
								fontSize: 15,
								color: colors.text,
							}}>
							{`${item.weekPrefix} ${item.name} ${
								getStr("dayOfWeek")[item.time.dayOfWeek]
							} [${item.time.beginTime.format("HH:mm")}, ${item.time.endTime.format(
								"HH:mm",
							)}]`}
						</Text>
						<TouchableOpacity
							style={{padding: 5, marginHorizontal: 6}}
							onPress={() => {
								const conflicts = scheduleConflicts({name: item.name, location: "", hash: "",
									type: item.type, activeTime: {base: [item.time]}, delOrHideTime: {base: []}}, baseSchedule);
								const overlapList = conflicts.map(({schedule, slice}): [string, ScheduleType, TimeSlice] => [schedule.name, schedule.type, slice]);
								if (overlapList.length) {
									Alert.alert(
										getStr("scheduleConflict"),
										getStr("unhideIntro") +
											overlapList
												.map(
													(val) =>
														"「" + val[0] + "」\n" +
														getStr("weekNumPrefix") +
														getWeekFromTime(val[2].beginTime, firstDay) +
														getStr("weekNumSuffix") +
														" " +
														getStr("dayOfWeek")[val[2].dayOfWeek] +
														" " +
														getStr("periodNumPrefix") +
														getBeginPeriod(val[2].beginTime) +
														(getBeginPeriod(val[2].beginTime) === getEndPeriod(val[2].endTime)
															? ""
															: " ~ " + getEndPeriod(val[2].endTime)) +
														getStr("periodNumSuffix"),
												)
												.join("\n\n") +
											getStr("unhideText"),
										[
											{
												text: getStr("confirm"),
												onPress: async () => {
													try {
														for (const {schedule, slice} of conflicts) {
															await deleteScheduleOccurrences(helper, reduxStore, schedule.localId, slice, Choice.ONCE, {firstDay, weekCount});
														}
														dispatch(scheduleRemoveHiddenRule([item.localId, item.time]));
													} catch { Alert.alert(getStr("networkRetry")); }
												},
											},
											{
												text: getStr("cancel"),
											},
										],
									);
								} else {
									dispatch(scheduleRemoveHiddenRule([item.localId, item.time]));
								}
							}}>
							<Text style={{color: colors.themePurple}}>解除隐藏</Text>
						</TouchableOpacity>
					</View>
				</>
			)}
			ListEmptyComponent={
				<EmptyState
					title={getStr("noHiddenLesson")}
					hint={getStr("hiddenLessonTip")}
				/>
			}
			keyExtractor={(item) =>
				`${item.localId}.${item.time.dayOfWeek}.[${item.time.beginTime.toDate()}-${item.time.endTime.toDate()}]`
			}
		/>
	);
};
