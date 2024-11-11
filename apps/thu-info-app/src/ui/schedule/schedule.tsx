import {View, Text, Dimensions, TouchableOpacity, FlatList, Switch} from "react-native";
import React, {
	useState,
	useEffect,
	useRef,
	useImperativeHandle,
	ElementRef,
} from "react";
import {useDispatch, useSelector} from "react-redux";
import {
	ExamTimeSlice,
	Schedule,
	ScheduleType,
	TimeSlice,
} from "@thu-info/lib/src/models/schedule/schedule";
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
import IconConfig from "../../assets/icons/IconConfig";
import IconDown from "../../assets/icons/IconDown";
import Slider from "@react-native-community/slider";
import {BottomPopupTriggerView} from "../../components/views";
import Snackbar from "react-native-snackbar";
import {configSet, setCalendarConfig} from "../../redux/slices/config";
import {getStatusBarHeight} from "react-native-safearea-height";
import {RefreshControl, ScrollView} from "react-native-gesture-handler";
import {CalendarData, Semester} from "@thu-info/lib/src/models/schedule/calendar";

const examBeginMap: {[key: string]: number} = {
	"9:00": 2.5,
	"2:30": 7.5,
	"14:30": 7.5,
	"7:00": 12,
	"19:00": 12,
};

const examEndMap: {[key: string]: number} = {
	"11:00": 3.5,
	"4:30": 8.5,
	"16:30": 8.5,
	"9:00": 13,
	"21:00": 13,
};

interface NormalSliceRenderData {
	type: "normal";
	slice: TimeSlice;
	schedule: Schedule;
	week: number;
}

interface ExamSliceRenderData {
	type: "exam";
	slice: ExamTimeSlice;
	schedule: Schedule;
}

type SliceRenderData = NormalSliceRenderData | ExamSliceRenderData;

const Header = React.forwardRef(
	(
		{
			calendar,
			setCalendar,
			onChangeSetOpenConfig,
			onSetWeek,
			navigation,
		}: {
			calendar: CalendarData | undefined;
			setCalendar: (payload: Semester & {nextSemesterIndex: number | undefined}) => void;
			onChangeSetOpenConfig: Function;
			navigation: RootNav;
			onSetWeek: Function;
		},
		ref: React.ForwardedRef<{setWeekNumber: (w: number) => void}>,
	) => {
		const themeName = useColorScheme();
		const theme = themes(themeName);
		const dark = useSelector((s: State) => s.config.darkMode);
		const darkModeHook = dark || themeName === "dark";

		const {firstDay, weekCount, semesterId} = useSelector(
			(s: State) => s.config,
		);
		const semesterType = Number(semesterId[semesterId.length - 1]);

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

		const [week, setWeek] = useState(nowWeek);

		useImperativeHandle(
			ref,
			() => {
				return {
					setWeekNumber: (w: number) => {
						setWeek(w);
					},
				};
			},
			[setWeek],
		);

		const windowWidth = Dimensions.get("window").width;
		const weekButtonWidth = (windowWidth - 24) / 4 - 6 - 1;

		return (
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
							<>
							{calendar && <View style={{marginHorizontal: 12}}>
								<TouchableOpacity style={{padding: 6}} onPress={() => {
									if (calendar) {
										setCalendar({ ...calendar, nextSemesterIndex: undefined });
									}
								}}>
									<Text style={{color: theme.colors.text, fontSize: 15}}>
										{calendar.semesterName}
									</Text>
								</TouchableOpacity>
								{calendar.nextSemesterList.map((semester, id) => (
									<TouchableOpacity style={{padding: 6}} key={semester.semesterId} onPress={() => {
										if (calendar) {
											setCalendar({ ...calendar.nextSemesterList[id], nextSemesterIndex: id });
										}
									}}>
										<Text style={{color: theme.colors.text, fontSize: 15}}>
											{semester.semesterName}
										</Text>
									</TouchableOpacity>
								))}
							</View>}
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
												onSetWeek(weekButton);
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
							</>
						)}
						popupCanFulfill={true}
						popupCancelable={true}
						popupOnFulfilled={() => {}}
						popupOnCancelled={() => {}}>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
							}}>
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
								textAlign: "center",
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
					<View style={{position: "absolute", right: 48, flexDirection: "row"}}>
						<TouchableOpacity onPress={() => onChangeSetOpenConfig()}>
							<IconConfig width={24} height={24} />
						</TouchableOpacity>
					</View>
					<View style={{position: "absolute", right: 16, flexDirection: "row"}}>
						<TouchableOpacity
							onPress={() => navigation.navigate("ScheduleAdd")}>
							<IconAdd width={24} height={24} />
						</TouchableOpacity>
					</View>
				</View>
			</View>
		);
	},
);

export const ScheduleScreen = ({navigation}: {navigation: RootNav}) => {
	const {baseSchedule, shortenMap} = useSelector((s: State) => s.schedule);
	const {firstDay, weekCount, nextSemesterIndex} = useSelector((s: State) => s.config);
	const dispatch = useDispatch();

	const [refreshing, setRefreshing] = useState(false);
	const [calendar, setCalendar] = useState<CalendarData | undefined>();

	const getSchedule = () => {
		setRefreshing(true);
		helper
			.getSchedule(nextSemesterIndex)
			.then((result) => {
				setCalendar(result.calendar);
				const semester = nextSemesterIndex === undefined || nextSemesterIndex >= result.calendar.nextSemesterList.length ? result.calendar : result.calendar.nextSemesterList[nextSemesterIndex];
				dispatch(setCalendarConfig({...semester, nextSemesterIndex}));
				dispatch(scheduleFetch({schedule: result.schedule, semesterId: semester.semesterId}));
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

	const themeName = useColorScheme();
	const theme = themes(themeName);

	const windowWidth = Math.floor(Dimensions.get("window").width);
	const windowHeight = Dimensions.get("window").height;
	const [tableHeight, setTableHeight] = useState(
		windowHeight - getStatusBarHeight() - 40,
	);
	const exactUnitHeight = (tableHeight - 40) / 14;
	const heightMode =
		useSelector((s: State) => s.config.scheduleHeightMode) ?? 10;
	const hideWeekend = useSelector((s: State) => s.config.hideWeekend);
	const unitHeight = exactUnitHeight * (1 + heightMode * 0.05);
	const scheduleBodyWidth = windowWidth - 32;
	const unitWidth = scheduleBodyWidth / (hideWeekend ? 5 : 7);
	const enableNewUI = useSelector((s: State) => s.config.scheduleEnableNewUI);

	const [openConfig, setOpenConfig] = useState(false);

	const colorList: string[] = theme.colors.courseItemColorList;

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(getSchedule, [nextSemesterIndex]);

	const allSchedule = () => {
		const weekSchedule: SliceRenderData[][] = new Array<SliceRenderData[]>(
			weekCount,
		);

		for (let w = 0; w < weekCount; ++w) {
			weekSchedule[w] = [];
		}

		baseSchedule.forEach((val) => {
			val.activeTime.base.forEach((slice) => {
				slice.activeWeeks.forEach((num) => {
					// 由于状态异步更新的时间差，在学期切换时，可能存在某个时刻，
					// baseSchedule 的最大周数超过了 weekCount，需要小心
					weekSchedule[num - 1]?.push({
						type: "normal",
						slice,
						schedule: val,
						week: num,
					});
				});
			});

			val.activeTime.exams?.forEach((slice) => {
				weekSchedule[slice.weekNumber - 1]?.push({
					type: "exam",
					slice,
					schedule: val,
				});
			});
		});

		return weekSchedule;
	};

	const flatListRef = useRef<FlatList>(null);
	const headerRef = useRef<ElementRef<typeof Header>>(null);

	return (
		<>
			<Header
				ref={headerRef}
				calendar={calendar}
				setCalendar={(payload) => dispatch(setCalendarConfig(payload))}
				onSetWeek={(w: number) => {
					flatListRef.current?.scrollToIndex({
						index: w - 1,
					});
				}}
				onChangeSetOpenConfig={() => {
					setOpenConfig((v) => !v);
				}}
				navigation={navigation}
			/>
			<View style={{flex: 1}}>
				<ScrollView
					onLayout={({nativeEvent}) => {
						setTableHeight(nativeEvent.layout.height);
					}}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={getSchedule}
							colors={[theme.colors.accent]}
							progressBackgroundColor={theme.colors.contentBackground}
						/>
					}>
					<View style={{flexDirection: "row"}}>
						{/* Timetable on the left */}
						<View style={{width: 32, top: 40}}>
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
									{heightMode > 1 && (
										<>
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
										</>
									)}
								</View>
							))}
						</View>

						{/* Main content */}
						<View style={{flex: 1}}>
							{/* Lunch and Supper mark */}
							<View
								style={{
									backgroundColor: theme.colors.inputBorder,
									height: 1,
									position: "absolute",
									left: 0,
									right: 0,
									top: 5 * unitHeight + 39.5,
								}}
							/>
							<View
								style={{
									backgroundColor: theme.colors.inputBorder,
									height: 1,
									position: "absolute",
									left: 0,
									right: 0,
									top: 11 * unitHeight + 39.5,
								}}
							/>
							<Text
								style={{
									position: "absolute",
									right: 8,
									top: 5 * unitHeight + 40,
									fontSize: 10,
									color: theme.colors.fontB3,
								}}>
								{getStr("lunch")}
							</Text>
							<Text
								style={{
									position: "absolute",
									right: 8,
									top: 11 * unitHeight + 40,
									fontSize: 10,
									color: theme.colors.fontB3,
								}}>
								{getStr("supper")}
							</Text>

							{/* Schedule content */}
							<FlatList
								ref={flatListRef}
								horizontal={true}
								showsHorizontalScrollIndicator={false}
								style={{width: scheduleBodyWidth}}
								initialNumToRender={3}
								getItemLayout={(_, index) => ({
									length: scheduleBodyWidth,
									offset: scheduleBodyWidth * index,
									index: index,
								})}
								data={allSchedule()}
								renderItem={({item, index: w}) => (
									<View
										style={{
											height: 14 * unitHeight + 40, // Header has a height of 40
											width: scheduleBodyWidth,
										}}>
										<View
											style={{
												height: 40,
												flexDirection: "row",
											}}>
											{Array.from(new Array(hideWeekend ? 5 : 7 )).map((_, index) => (
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
																w === nowWeek - 1 && today === index + 1
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
															.add(w * 7 + index, "day")
															.format("MM/DD")}
													</Text>
												</View>
											))}
										</View>
										<View>
											{(item as SliceRenderData[]).map((data) => {
												if (hideWeekend && data.slice.dayOfWeek > 5) {
													return null;
												}
												if (data.type === "normal") {
													const slice = data.slice;
													const val = data.schedule;
													const num = data.week;
													return (
														<ScheduleBlock
															dayOfWeek={slice.dayOfWeek}
															begin={slice.begin}
															end={slice.end}
															name={
																shortenMap[val.name] ??
																val.name.substring(
																	val.type === ScheduleType.CUSTOM ? 6 : 0,
																)
															}
															location={val.location}
															gridHeight={unitHeight}
															gridWidth={unitWidth}
															key={`${val.name}-${num}-${slice.dayOfWeek}-${slice.begin}-${val.location}`}
															blockColor={
																`${colorList[
																	parseInt(md5(val.name).substr(0, 6), 16) %
																		colorList.length
																]}${enableNewUI ? "33" : ""}`
															}
															textColor={enableNewUI ? colorList[parseInt(md5(val.name).substr(0, 6), 16) % colorList.length] : "white"}
															onPress={() => {
																navigation.navigate("ScheduleDetail", {
																	name: val.name,
																	location: val.location,
																	week: num,
																	dayOfWeek: slice.dayOfWeek,
																	begin: slice.begin,
																	end: slice.end,
																	alias: shortenMap[val.name] ?? "",
																	type: val.type,
																});
															}}
														/>
													);
												} else if (data.type === "exam") {
													const slice = data.slice;
													const val = data.schedule;
													return (
														<ScheduleBlock
															dayOfWeek={slice.dayOfWeek}
															begin={examBeginMap[slice.begin]}
															end={examEndMap[slice.end]}
															name={
																shortenMap[val.name] ??
																val.name.substring(
																	val.type === ScheduleType.CUSTOM ? 6 : 0,
																)
															}
															location={val.location}
															gridHeight={unitHeight}
															gridWidth={unitWidth}
															key={`${val.name}-${slice.weekNumber}-${slice.dayOfWeek}-${slice.begin}-${val.location}`}
															blockColor={
																`${colorList[
																parseInt(md5(val.name).substr(0, 6), 16) %
																colorList.length
																]}${enableNewUI ? "33" : ""}`
															}
															textColor={enableNewUI ? colorList[parseInt(md5(val.name).substr(0, 6), 16) % colorList.length] : "white"}
															onPress={() => {
																navigation.navigate("ScheduleDetail", {
																	name: val.name,
																	location: val.location,
																	week: slice.weekNumber,
																	dayOfWeek: slice.dayOfWeek,
																	begin: slice.begin,
																	end: slice.end,
																	alias: shortenMap[val.name] ?? "",
																	type: val.type,
																});
															}}
														/>
													);
												}
											})}
										</View>
									</View>
								)}
								initialScrollIndex={nowWeek - 1}
								onScroll={({nativeEvent}) => {
									const index = Math.round(
										nativeEvent.contentOffset.x / scheduleBodyWidth,
									);
									headerRef.current?.setWeekNumber(index + 1);
								}}
								pagingEnabled={true}
							/>
						</View>
					</View>
				</ScrollView>
				{openConfig && (
					<TouchableOpacity
						onPress={() => setOpenConfig(false)}
						style={{
							position: "absolute",
							height: "100%",
							width: "100%",
							backgroundColor: "#00000055",
						}}>
						<View style={{backgroundColor: theme.colors.contentBackground}}>
							<Slider
								style={{height: 40, width: "100%"}}
								minimumValue={0}
								maximumValue={20}
								step={1}
								minimumTrackTintColor={theme.colors.themePurple}
								thumbTintColor={theme.colors.primary}
								value={heightMode}
								onValueChange={(value) => {
									dispatch(
										configSet({
											key: "scheduleHeightMode",
											value: value as number,
										}),
									);
								}}
							/>
						</View>
						<View
							style={{
								backgroundColor: theme.colors.contentBackground,
								flexDirection: "row",
								justifyContent: "space-between",
								paddingHorizontal: 16,
								paddingVertical: 8,
							}}>
							<Text
							style={{
								color: theme.colors.fontB1,
								fontSize: 16,
							}}>{getStr("hideWeekend")}</Text>
							<Switch
							thumbColor={theme.colors.contentBackground}
							trackColor={{ true: theme.colors.themePurple }}
							value={hideWeekend}
							onValueChange={(value: boolean) => {
								dispatch(configSet({
								key: "hideWeekend",
								value: value,
								}));
							}}
							/>
						</View>
					</TouchableOpacity>
				)}
			</View>
		</>
	);
};
