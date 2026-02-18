import {useDispatch, useSelector} from "react-redux";
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
	ScheduleType,
	TimeSlice,
	getBeginPeriod,
	getEndPeriod,
	getWeekFromTime,
} from "@thu-info/lib/src/models/schedule/schedule";
import {getStr} from "../../utils/i18n";
import {
	Choice,
	scheduleDelOrHide,
	scheduleRemoveHiddenRule,
} from "../../redux/slices/schedule";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";

export const ScheduleHiddenScreen = () => {
	let screenHeight = Dimensions.get("window");
	const themeName = useColorScheme();
	const theme = themes(themeName);

	const baseSchedule = useSelector((s: State) => s.schedule.baseSchedule);
	const firstDay = useSelector((s: State) => s.config.firstDay);
	const dispatch = useDispatch();

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
				val.delOrHideTime.base.forEach((e) => {
					const week = getWeekFromTime(e.beginTime, firstDay);
					const resStr = getStr("weekNumPrefix") + week + getStr("weekNumSuffix");
					res.push({
						name: val.name,
						type: val.type,
						time: e,
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
							item.time.beginTime.format("HH:mm")
						}, ${item.time.endTime.format("HH:mm")}]`}
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
										hash: "",
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
											onPress: () => {
												dispatch(
													scheduleRemoveHiddenRule([item.name, item.time]),
												);
												overlapList.forEach((val) => {
													dispatch(
														scheduleDelOrHide([val[0], val[2], Choice.ONCE]),
													);
												});
											},
										},
										{
											text: getStr("cancel"),
										},
									],
								);
							} else {
								dispatch(scheduleRemoveHiddenRule([item.name, item.time]));
							}
						}}>
						<Text style={{color: theme.colors.themePurple}}>解除隐藏</Text>
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
				`${item.name}.${item.time.dayOfWeek}.[${item.time.beginTime.toDate()}-${item.time.endTime.toDate()}]`
			}
		/>
	);
};
