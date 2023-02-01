import {
	ScrollView,
	View,
	Text,
	Dimensions,
	TouchableOpacity,
	RefreshControl,
} from "react-native";
import {ReactElement, useState, useEffect} from "react";
import {useDispatch, useSelector} from "react-redux";
import {
	activeWeek,
	ScheduleType,
} from "thu-info-lib/dist/models/schedule/schedule";
import {RootNav} from "../../components/Root";
import {helper, State} from "../../redux/store";
import {scheduleFetch} from "../../redux/slices/schedule";
import {ScheduleBlock} from "../../components/schedule/schedule";
import dayjs from "dayjs";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import md5 from "md5";
import {beginTime, endTime} from "./scheduleDetail";
import IconAdd from "../../assets/icons/IconAdd";
import IconDown from "../../assets/icons/IconDown";
import {BottomPopupTriggerView} from "../../components/views";
import Snackbar from "react-native-snackbar";
import {setCalendarConfig} from "../../redux/slices/config";
import {getStatusBarHeight} from "react-native-status-bar-height";

const examBeginMap: {[key: string]: number} = {
	"9:00": 2.5,
	"2:30": 7.5,
	"14:30": 7.5,
	"7:00": 6.5,
	"19:00": 6.5,
};

const examEndMap: {[key: string]: number} = {
	"11:00": 3.5,
	"4:30": 8.5,
	"16:30": 8.5,
	"9:00": 13,
	"21:00": 13,
};

export const ScheduleScreen = ({navigation}: {navigation: RootNav}) => {
	const {baseSchedule, shortenMap} = useSelector((s: State) => s.schedule);
	const {firstDay, weekCount, semesterId} = useSelector((s: State) => s.config);
	const dispatch = useDispatch();

	const [refreshing, setRefreshing] = useState(false);

	const getSchedule = () => {
		setRefreshing(true);
		helper
			.getSchedule()
			.then(({schedule, calendar}) => {
				dispatch(setCalendarConfig(calendar));
				dispatch(scheduleFetch({schedule, semesterId: calendar.semesterId}));
			})
			.catch((e) => {
				Snackbar.show({
					text:
						typeof e.message === "string" ? e.message : getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				});
			})
			.then(() => setRefreshing(false));
	};

	const current = dayjs();
	const weekNumber = Math.floor(current.diff(firstDay) / 604800000) + 1;
	const nowWeek = (() => {
		if (weekNumber > weekCount) {
			return weekCount;
		} else if (weekNumber < 1) {
			return 1;
		} else {
			return weekNumber;
		}
	})();
	const today = current.day() === 0 ? 7 : current.day();

	const [week, setWeek] = useState(nowWeek);

	const semesterType = Number(semesterId[semesterId.length - 1]);

	const themeName = useColorScheme();
	const theme = themes(themeName);

	const dark = useSelector((s: State) => s.config.darkMode);
	const darkModeHook = dark || themeName === "dark";

	const windowWidth = Dimensions.get("window").width;
	const unitHeight = 60;
	const unitWidth = (windowWidth - 8) / (7 + 1 / 2);
	const weekButtonWidth = (windowWidth - 24) / 4 - 6 - 1;

	const colorList: string[] = [
		"#4DD28D",
		"#55E4C6",
		"#E8CE4F",
		"#E48555",
		"#8B55E4",
		"#5599E4",
		"#BC4C55",
	];

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(getSchedule, []);

	const allSchedule = () => {
		let components: ReactElement[] = [];
		baseSchedule
			.filter((val) => activeWeek(val.activeTime, week))
			.forEach((val) => {
				val.activeTime.base.forEach((slice) => {
					slice.activeWeeks.forEach((num) => {
						if (num === week) {
							components.push(
								<ScheduleBlock
									dayOfWeek={slice.dayOfWeek}
									begin={slice.begin}
									end={slice.end}
									name={
										shortenMap[val.name] ??
										val.name.substring(val.type === ScheduleType.CUSTOM ? 6 : 0)
									}
									location={val.location}
									gridHeight={unitHeight}
									gridWidth={unitWidth}
									key={`${val.name}-${num}-${slice.dayOfWeek}-${slice.begin}-${val.location}`}
									blockColor={
										colorList[
											parseInt(md5(val.name).substr(0, 6), 16) %
												colorList.length
										]
									}
									onPress={() => {
										navigation.navigate("ScheduleDetail", {
											name: val.name,
											location: val.location,
											week: week,
											dayOfWeek: slice.dayOfWeek,
											begin: slice.begin,
											end: slice.end,
											alias: shortenMap[val.name] ?? "",
											type: val.type,
										});
									}}
								/>,
							);
						}
					});
				});
				val.activeTime.exams?.forEach((slice) => {
					if (slice.weekNumber === week) {
						components.push(
							<ScheduleBlock
								dayOfWeek={slice.dayOfWeek}
								begin={examBeginMap[slice.begin]}
								end={examEndMap[slice.end]}
								name={
									shortenMap[val.name] ??
									val.name.substring(val.type === ScheduleType.CUSTOM ? 6 : 0)
								}
								location={val.location}
								gridHeight={unitHeight}
								gridWidth={unitWidth}
								key={`${val.name}-${week}-${slice.dayOfWeek}-${slice.begin}-${val.location}`}
								blockColor={
									colorList[
										parseInt(md5(val.name).substr(0, 6), 16) % colorList.length
									]
								}
								onPress={() => {
									navigation.navigate("ScheduleDetail", {
										name: val.name,
										location: val.location,
										week: week,
										dayOfWeek: slice.dayOfWeek,
										begin: slice.begin,
										end: slice.end,
										alias: shortenMap[val.name] ?? "",
										type: val.type,
									});
								}}
							/>,
						);
					}
				});
			});
		return components;
	};

	return (
		<>
			<View
				style={{
					paddingVertical: 4,
					alignItems: "center",
					backgroundColor: theme.colors.contentBackground,
					paddingTop: getStatusBarHeight(),
				}}
				key={String(darkModeHook)}>
				<View
					style={{
						width: "100%",
						alignItems: "center",
						justifyContent: "center",
					}}>
					<BottomPopupTriggerView
						popupTitle={`${getStr("weekNumPrefix")}${week}${getStr(
							"weekNumSuffix",
						)}`}
						popupContent={(done) => (
							<View
								style={{
									margin: 12,
									marginTop: 7,
									flexDirection: "row",
									flexWrap: "wrap",
								}}>
								{Array.from(new Array(weekCount), (_, k) => k + 1).map(
									(weekButton) => (
										<TouchableOpacity
											style={{
												width: weekButtonWidth,
												marginHorizontal: 3,
												marginVertical: 4,
												alignItems: "center",
												backgroundColor:
													week === weekButton
														? theme.colors.themePurple
														: undefined,
												borderRadius: 8,
											}}
											onPress={() => {
												setWeek(weekButton);
												done();
											}}
											key={weekButton}>
											<Text
												style={{
													fontSize: 18,
													lineHeight: 40,
													fontWeight:
														week !== weekButton && weekNumber === weekButton
															? "600"
															: "normal",
													color:
														week === weekButton
															? "white"
															: weekNumber === weekButton
															? theme.colors.themePurple
															: theme.colors.fontB1,
												}}>
												{weekButton}
											</Text>
										</TouchableOpacity>
									),
								)}
							</View>
						)}
						popupCanFulfill={true}
						popupCancelable={true}
						popupOnFulfilled={() => {}}
						popupOnCancelled={() => {}}>
						<View style={{flexDirection: "row", alignItems: "flex-end"}}>
							<Text
								style={{
									fontSize: 18,
									fontWeight: "bold",
									color: theme.colors.fontB1,
								}}>
								{getStr("weekNumPrefix")}
								{week}
								{getStr("weekNumSuffix")}
							</Text>
							<IconDown width={16} height={16} />
						</View>
						<Text
							style={{
								fontSize: 12,
								color: theme.colors.fontB2,
							}}>
							{getStr(
								semesterType === 1
									? "autumn"
									: semesterType === 2
									? "spring"
									: semesterType === 3
									? "summer"
									: "winter",
							)}
						</Text>
					</BottomPopupTriggerView>
					<View style={{position: "absolute", right: 16, flexDirection: "row"}}>
						<TouchableOpacity
							onPress={() => navigation.navigate("ScheduleAdd")}>
							<IconAdd width={24} height={24} />
						</TouchableOpacity>
					</View>
				</View>
				<View
					style={{
						flexDirection: "row",
						paddingVertical: 2,
						alignItems: "center",
					}}
					key="0">
					<View
						style={{
							flex: 0,
							width: 32,
						}}
						key="0-0"
					/>
					{Array.from(new Array(7)).map((_, index) => (
						<View
							style={{
								flex: 1,
								padding: 4,
								alignItems: "center",
								justifyContent: "center",
							}}
							key={`0-${index + 1}`}>
							<Text
								style={{
									textAlign: "center",
									fontSize: 12,
									color: theme.colors.fontB1,
								}}>
								{getStr("dayOfWeek")[index + 1]}
							</Text>
							<View
								style={{
									width: 18,
									height: 2,
									borderRadius: 1,
									backgroundColor:
										week === nowWeek && today === index + 1
											? theme.colors.themePurple
											: undefined,
								}}
							/>
							<Text
								style={{
									textAlign: "center",
									fontSize: 9,
									color: theme.colors.fontB1,
								}}>
								{dayjs(firstDay)
									.add((week - 1) * 7 + index, "day")
									.format("MM/DD")}
							</Text>
						</View>
					))}
				</View>
			</View>
			<ScrollView
				style={{flex: 1, flexDirection: "column"}}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={getSchedule}
						colors={[theme.colors.accent]}
					/>
				}>
				<View style={{flexDirection: "row"}}>
					<View style={{width: 32}}>
						{Array.from(new Array(14), (_, k) => k + 1).map((session) => (
							<View
								style={{
									alignItems: "center",
									justifyContent: "center",
									height: unitHeight,
								}}
								key={`${session}-0`}>
								<Text
									style={{
										textAlign: "center",
										color: theme.colors.fontB1,
										fontSize: 12,
									}}>
									{session}
								</Text>
								<Text
									style={{
										textAlign: "center",
										color: theme.colors.fontB2,
										fontSize: 8,
										marginTop: 4,
									}}>
									{beginTime[session]}
								</Text>
								<Text
									style={{
										textAlign: "center",
										color: theme.colors.fontB2,
										fontSize: 8,
										marginTop: 1,
									}}>
									{endTime[session]}
								</Text>
							</View>
						))}
					</View>
					<View style={{flex: 1}}>
						<View
							style={{
								backgroundColor: theme.colors.themeGrey,
								height: 1,
								position: "absolute",
								left: 0,
								right: 0,
								top: 300,
							}}
						/>
						<View
							style={{
								backgroundColor: theme.colors.themeGrey,
								height: 1,
								position: "absolute",
								left: 0,
								right: 0,
								top: 660,
							}}
						/>
						<Text
							style={{
								position: "absolute",
								right: 12,
								top: 302,
								fontSize: 12,
								color: theme.colors.fontB3,
							}}>
							{getStr("lunch")}
						</Text>
						<Text
							style={{
								position: "absolute",
								right: 12,
								top: 662,
								fontSize: 12,
								color: theme.colors.fontB3,
							}}>
							{getStr("supper")}
						</Text>
						{allSchedule()}
					</View>
				</View>
			</ScrollView>
		</>
	);
};
