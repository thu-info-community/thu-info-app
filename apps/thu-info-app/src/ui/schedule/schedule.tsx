import {
	View,
	Text,
	Dimensions,
	TouchableOpacity,
	FlatList,
	Switch,
	Platform,
	ToastAndroid,
	Animated,
	Easing,
	Alert,
	ActivityIndicator,
} from "react-native";
import React, {
	useState,
	useEffect,
	useRef,
	useImperativeHandle,
	ElementRef,
} from "react";
import {useDispatch, useSelector} from "react-redux";
import {
	Schedule,
	ScheduleType,
	TimeSlice,
	getWeekFromTime,
} from "@thu-info/lib/src/models/schedule/schedule";
import {helper, State} from "../../redux/store";
import {scheduleFetch} from "../../redux/slices/schedule";
import {ScheduleBlock} from "../../components/schedule/schedule";
import dayjs from "dayjs";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import md5 from "md5";
import IconAdd from "../../assets/icons/IconAdd";
import IconConfig from "../../assets/icons/IconConfig";
import IconDown from "../../assets/icons/IconDown";
import IconUpload from "../../assets/icons/IconUpload";
import Slider from "@react-native-community/slider";
import {BottomPopupTriggerView} from "../../components/views";
import {Snackbar} from "react-native-snackbar";
import {configSet, setCalendarConfig} from "../../redux/slices/config";
import {getStatusBarHeight} from "react-native-safearea-height";
import {GestureHandlerRootView, RefreshControl, ScrollView} from "react-native-gesture-handler";
import {CalendarData, Semester} from "@thu-info/lib/src/models/schedule/calendar";
import {exportScheduleToICS} from "../../utils/calendar";
import Share from "react-native-share";
import {ScheduleAddModal, ScheduleEditParams} from "../../components/schedule/scheduleAdd";
import {Choice, scheduleDelOrHide} from "../../redux/slices/schedule";
import IconTime from "../../assets/icons/IconTime";
import IconBoard from "../../assets/icons/IconBoard";
import IconTrademark from "../../assets/icons/IconTrademark";

interface NormalSliceRenderData {
	type: "normal";
	slice: TimeSlice;
	schedule: Schedule;
	week: number;
}

type SliceRenderData = NormalSliceRenderData;

export const beginTime = [
	"",
	"08:00",
	"08:50",
	"09:50",
	"10:40",
	"11:30",
	"13:30",
	"14:20",
	"15:20",
	"16:10",
	"17:05",
	"17:55",
	"19:20",
	"20:10",
	"21:00",
];

export const endTime = [
	"",
	"08:45",
	"09:35",
	"10:35",
	"11:25",
	"12:15",
	"14:15",
	"15:05",
	"16:05",
	"16:55",
	"17:50",
	"18:40",
	"20:05",
	"20:55",
	"21:45",
];

const Header = React.forwardRef(
	(
		{
			calendar,
			setCalendar,
			onChangeSetOpenConfig,
			onPressAdd,
			onSetWeek,
			onPressUpload,
			hasCustomSchedule,
			uploadingCustomSchedule,
		}: {
			calendar: CalendarData | undefined;
			setCalendar: (payload: Semester & {nextSemesterIndex: number | undefined}) => void;
			onChangeSetOpenConfig: Function;
			onSetWeek: Function;
			onPressAdd: () => void;
			onPressUpload: () => void;
			hasCustomSchedule: boolean;
			uploadingCustomSchedule: boolean;
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
						popupContent={(done: () => void) => (
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
								paddingStart: 2,
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
					{hasCustomSchedule && (
						<View
							style={{
								position: "absolute",
								right: 80,
								flexDirection: "row",
							}}>
							<TouchableOpacity
								onPress={() => onPressUpload()}
								disabled={uploadingCustomSchedule}
								activeOpacity={0.7}>
								{uploadingCustomSchedule ? (
									<ActivityIndicator
										size="small"
										color={theme.colors.themePurple}
									/>
								) : (
									<IconUpload width={24} height={24} />
								)}
							</TouchableOpacity>
						</View>
					)}
					<View style={{position: "absolute", right: 48, flexDirection: "row"}}>
						<TouchableOpacity onPress={() => onChangeSetOpenConfig()}>
							<IconConfig width={24} height={24} />
						</TouchableOpacity>
					</View>
					<View style={{position: "absolute", right: 16, flexDirection: "row"}}>
						<TouchableOpacity
							onPress={onPressAdd}>
							<IconAdd width={24} height={24} />
						</TouchableOpacity>
					</View>
				</View>
			</View>
		);
	},
);

export const ScheduleScreen = () => {
	const {baseSchedule, shortenMap} = useSelector((s: State) => s.schedule);
	const {firstDay, weekCount, nextSemesterIndex} = useSelector(
		(s: State) => s.config,
	);
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

	const handleExportICS = async () => {
		if (!calendar) {
			Snackbar.show({
				text: getStr("scheduleExportICS"),
				duration: Snackbar.LENGTH_SHORT,
			});
			return;
		}

		try {
			const semester = nextSemesterIndex === undefined || nextSemesterIndex >= calendar.nextSemesterList.length ? calendar : calendar.nextSemesterList[nextSemesterIndex];
			const result = await exportScheduleToICS(baseSchedule, semester);

			if (result.success && result.filePath) {
				if (result.method === "download") {
					// Already saved to Downloads
					Snackbar.show({
						text: getStr("scheduleICSDownloaded"),
						duration: Snackbar.LENGTH_LONG,
					});
				} else {
					// Manual share
					await Share.open({
						title: getStr("scheduleExportICS"),
						url: `file://${result.filePath}`,
						type: "text/calendar",
						filename: semester.semesterName + ".ics",
						subject: getStr("scheduleICSFileName") + " - " + semester.semesterName,
					});

					Snackbar.show({
						text: getStr("scheduleICSGenerated"),
						duration: Snackbar.LENGTH_SHORT,
					});
				}
			} else {
				throw new Error("Export failed");
			}
		} catch {
			Snackbar.show({
				text: getStr("saveFailRetry"),
				duration: Snackbar.LENGTH_SHORT,
			});
		}
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
	const dark = useSelector((s: State) => s.config.darkMode);
	const isDarkMode = dark || themeName === "dark";

	const windowWidth = Math.floor(Dimensions.get("window").width);
	const windowHeight = Dimensions.get("window").height;
	const [tableHeight, setTableHeight] = useState(
		windowHeight - getStatusBarHeight() - 40,
	);
	// 按上课时间（8:00-21:45）划分为 13.75 小时
	const exactHourHeight = (tableHeight - 40) / 13.75;
	const heightMode =
		useSelector((s: State) => s.config.scheduleHeightMode) ?? 10;
	const hideWeekend = useSelector((s: State) => s.config.hideWeekend);
	const showOfficialSchedule =
		useSelector((s: State) => s.config.showOfficialSchedule) ?? true;
	const showCustomSchedule =
		useSelector((s: State) => s.config.showCustomSchedule) ?? true;
	// 每小时高度，根据设置进行缩放
	const hourHeight = exactHourHeight * (1 + heightMode * 0.05);
	// 每分钟高度
	const minuteHeight = hourHeight / 60;
	// 左侧时间列宽度和中间纵向时间轴宽度
	const timeLabelWidth = 40;
	const timeAxisWidth = 8;
	const scheduleBodyWidth = windowWidth - timeLabelWidth - timeAxisWidth;
	const unitWidth = scheduleBodyWidth / (hideWeekend ? 5 : 7);
	const enableNewUI = useSelector((s: State) => s.config.scheduleEnableNewUI);

	const [uploadingCustomSchedule, setUploadingCustomSchedule] = useState(false);

	const customSchedulesInCurrentSemester = baseSchedule.filter((schedule) => {
		if (schedule.type !== ScheduleType.CUSTOM) {
			return false;
		}
		return schedule.activeTime.base.some((slice) => {
			const week = getWeekFromTime(slice.beginTime, firstDay);
			return week >= 1 && week <= weekCount;
		});
	});

	const hasCustomScheduleInCurrentSemester =
		customSchedulesInCurrentSemester.length > 0;

	const [openConfig, setOpenConfig] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);
	const [editingParams, setEditingParams] = useState<ScheduleEditParams | undefined>(undefined);
	const [actionTarget, setActionTarget] = useState<ScheduleEditParams | undefined>(undefined);
	const [detailExpanded, setDetailExpanded] = useState(false);
	const [detailContentHeight, setDetailContentHeight] = useState(0);
	const detailAnim = useRef(new Animated.Value(0)).current;

	const nullAlias = (str: string | undefined) => {
		if (str === undefined) {
			return true;
		}
		return str.length === 0;
	};

	const handleHide = (choice: Choice, label: string) => {
		if (!actionTarget) {
			return;
		}
		if (actionTarget.type === ScheduleType.EXAM) {
			return;
		}
		dispatch(
			scheduleDelOrHide([
				actionTarget.name,
				{
					dayOfWeek: actionTarget.dayOfWeek,
					beginTime: actionTarget.beginTime,
					endTime: actionTarget.endTime,
				},
				choice,
			]),
		);
		setActionTarget(undefined);
		setDetailExpanded(false);
		detailAnim.setValue(0);
		if (Platform.OS === "android") {
			ToastAndroid.showWithGravity(
				`已成功${label}`,
				ToastAndroid.SHORT,
				ToastAndroid.TOP,
			);
		}
	};

	const renderDetailContent = () => {
		if (!actionTarget) {
			return null;
		}
		const detailTextColor = isDarkMode ? theme.colors.fontB0 : theme.colors.fontB1;
		const detailSecondaryColor = isDarkMode ? theme.colors.fontB1 : theme.colors.fontB2;
		return (
			<View
				style={{
					paddingHorizontal: 16,
					paddingVertical: 12,
				}}>
				<Text
					style={{
						fontSize: 16,
						fontWeight: "600",
						color: detailTextColor,
						marginBottom: 4,
					}}
					numberOfLines={2}>
					{nullAlias(actionTarget.alias)
						? actionTarget.name.substring(
								actionTarget.type === ScheduleType.CUSTOM ? 6 : 0,
						  )
						: actionTarget.alias}
				</Text>
				<Text
					style={{
						fontSize: 13,
						color: theme.colors.themePurple,
						marginBottom: 8,
					}}>
					{actionTarget.location === ""
						? getStr("locationUnset")
						: actionTarget.location}
				</Text>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginBottom: 4,
					}}>
					<IconTime height={15} width={15} />
					<Text
						style={{
							marginLeft: 8,
							color: detailSecondaryColor,
							fontSize: 13,
						}}>
						{getStr("dayOfWeek")[actionTarget.dayOfWeek]}
						{(getStr("mark") === "CH" ? "（" : "(") +
							actionTarget.beginTime.format("HH:mm") +
							" ~ " +
							actionTarget.endTime.format("HH:mm") +
							(getStr("mark") === "CH" ? "）" : ")")}
					</Text>
				</View>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						marginBottom: 4,
					}}>
					<IconBoard height={15} width={15} />
					<Text
						style={{
							marginLeft: 8,
							color: detailSecondaryColor,
							fontSize: 13,
						}}>
						{getStr("weekNumPrefix") +
							actionTarget.week +
							getStr("weekNumSuffix")}
					</Text>
				</View>
				{!nullAlias(actionTarget.alias) && (
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
						}}>
						<IconTrademark height={15} width={15} />
						<Text
							style={{
								marginLeft: 8,
								color: detailSecondaryColor,
								fontSize: 13,
							}}>
							{actionTarget.name.substring(
								actionTarget.type === ScheduleType.CUSTOM ? 6 : 0,
							)}
							{getStr("lp")}
							{getStr("originalName")}
							{getStr("rp")}
						</Text>
					</View>
				)}
			</View>
		);
	};

	const colorList: string[] = theme.colors.courseItemColorList;

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(getSchedule, [nextSemesterIndex]);

	const handleUploadCustomSchedule = () => {
		if (!hasCustomScheduleInCurrentSemester || uploadingCustomSchedule) {
			return;
		}
		Alert.alert(
			getStr("scheduleUploadCustomTitle"),
			getStr("scheduleUploadCustomMessage"),
			[
				{
					text: getStr("cancel"),
					style: "cancel",
				},
				{
					text: getStr("scheduleUploadCustomConfirm"),
					onPress: async () => {
						setUploadingCustomSchedule(true);
						try {
							await helper.saveCustomSchedule(customSchedulesInCurrentSemester);
							Snackbar.show({
								text: getStr("scheduleUploadCustomSuccess"),
								duration: Snackbar.LENGTH_SHORT,
							});
							getSchedule();
						} catch {
							Snackbar.show({
								text: getStr("networkRetry"),
								duration: Snackbar.LENGTH_SHORT,
							});
						} finally {
							setUploadingCustomSchedule(false);
						}
					},
				},
			],
		);
	};

	const allSchedule = () => {
		const weekSchedule: SliceRenderData[][] = new Array<SliceRenderData[]>(
			weekCount,
		);

		for (let w = 0; w < weekCount; ++w) {
			weekSchedule[w] = [];
		}

		baseSchedule.forEach((val) => {
			if (
				(val.type === ScheduleType.CUSTOM && !showCustomSchedule) ||
				(val.type !== ScheduleType.CUSTOM && !showOfficialSchedule)
			) {
				return;
			}
			val.activeTime.base.forEach((slice) => {
				const week = getWeekFromTime(slice.beginTime, firstDay);
				// 由于状态异步更新的时间差，在学期切换时，可能存在某个时刻，
				// baseSchedule 的最大周数超过了 weekCount，需要小心
				weekSchedule[week - 1]?.push({
					type: "normal",
					slice,
					schedule: val,
					week: week,
				});
			});
		});

		return weekSchedule;
	};

	const flatListRef = useRef<FlatList>(null);
	const headerRef = useRef<ElementRef<typeof Header>>(null);
	const scrollViewRef = useRef<ScrollView>(null);
	const hasScrolledToInitialRef = useRef(false);

	// 打开计划时默认滚动，使「8:00」时间轴在首屏第一个可见（左侧时间列 top: 40，标签在 40 + hour*hourHeight - 6）
	useEffect(() => {
		if (
			tableHeight > 0 &&
			!hasScrolledToInitialRef.current &&
			scrollViewRef.current
		) {
			hasScrolledToInitialRef.current = true;
			// 视口顶放在 7:00 标签下方一点，这样第一个完整露出的是「8:00」
			const scrollY = 40 + 7 * hourHeight - 5;
			scrollViewRef.current.scrollTo({
				y: scrollY,
				animated: false,
			});
		}
	}, [tableHeight, hourHeight]);

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
				onPressAdd={() => setShowAddModal(true)}
				onPressUpload={handleUploadCustomSchedule}
				hasCustomSchedule={hasCustomScheduleInCurrentSemester}
				uploadingCustomSchedule={uploadingCustomSchedule}
			/>
			<GestureHandlerRootView style={{flex: 1}}>
				<ScrollView
					ref={scrollViewRef}
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
						{/* Timetable on the left: 0:00 - 24:00 */}
						<View style={{width: timeLabelWidth, top: 40}}>
							{Array.from(new Array(25), (_, k) => k).map((hour) => (
								<Text
									key={`time-label-${hour}`}
									style={{
										position: "absolute",
										top: hour * hourHeight - 6, // roughly center text on the line
										width: timeLabelWidth,
										textAlign: "center",
										color: theme.colors.fontB1,
										fontSize: 10,
									}}>
									{String(hour).padStart(2, "0")}:00
								</Text>
							))}
						</View>

						{/* Vertical time axis with class time markers */}
						<View
							style={{
								width: timeAxisWidth,
								top: 40,
								height: 24 * hourHeight,
							}}>
							{/* main vertical line */}
							<View
								style={{
									position: "absolute",
									left: timeAxisWidth / 2,
									top: 0,
									bottom: 0,
									width: 1,
									backgroundColor: theme.colors.inputBorder,
								}}
							/>
							{/* begin time markers */}
							{beginTime.map((time, idx) => {
								if (!time) {
									return null;
								}
								const [h, m] = time.split(":");
								const minutes =
									parseInt(h, 10) * 60 + parseInt(m, 10);
								return (
									<View
										key={`axis-begin-${idx}`}
										style={{
											position: "absolute",
											left: timeAxisWidth / 2 - 3,
											top: minutes * minuteHeight - 3,
											width: 6,
											height: 6,
											borderRadius: 3,
											backgroundColor: theme.colors.contentBackground,
											borderWidth: 1,
											borderColor: theme.colors.inputBorder,
										}}
									/>
								);
							})}
							{/* end time markers */}
							{endTime.map((time, idx) => {
								if (!time) {
									return null;
								}
								const [h, m] = time.split(":");
								const minutes =
									parseInt(h, 10) * 60 + parseInt(m, 10);
								return (
									<View
										key={`axis-end-${idx}`}
										style={{
											position: "absolute",
											left: timeAxisWidth / 2 - 3,
											top: minutes * minuteHeight - 3,
											width: 6,
											height: 6,
											borderRadius: 3,
											backgroundColor: theme.colors.contentBackground,
											borderWidth: 1,
											borderColor: theme.colors.inputBorder,
										}}
									/>
								);
							})}
						</View>

						{/* Main content */}
						<View style={{flex: 1}}>
							{/* Hour marks */}
							{Array.from(new Array(25), (_, k) => k).map((hour) => (
								<View
									key={`hour-line-${hour}`}
									style={{
										backgroundColor: theme.colors.inputBorder,
										height: 1,
										position: "absolute",
										left: 0,
										right: 0,
										top: hour * hourHeight + 40,
									}}
								/>
							))}

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
											// Header has a height of 40
											height: 24 * hourHeight + 40,
											width: scheduleBodyWidth,
										}}>
										<View
											style={{
												height: 40,
												flexDirection: "row",
											}}>
											{Array.from(new Array(hideWeekend ? 5 : 7)).map((_, index) => (
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
										<View style={{height: 24 * hourHeight, width: scheduleBodyWidth}}>
											<TouchableOpacity
												activeOpacity={1}
												style={{
													position: "absolute",
													left: 0,
													right: 0,
													top: 40,
													bottom: 0,
												}}
												onPress={() => {
													setEditingParams(undefined);
													setShowAddModal(true);
												}}
											/>
											{(item as SliceRenderData[]).map((data) => {
												if (hideWeekend && data.slice.dayOfWeek > 5) {
													return null;
												}
												if (data.type === "normal") {
													const slice = data.slice;
													const val = data.schedule;
													const num = data.week;
													// 计算距离 0:00 的分钟数
													const beginMinutes =
														slice.beginTime.hour() * 60 +
														slice.beginTime.minute();
													const endMinutes =
														slice.endTime.hour() * 60 +
														slice.endTime.minute();
													const beginClamped = Math.max(0, Math.min(24 * 60, beginMinutes));
													const endClamped = Math.max(
														beginClamped,
														Math.min(24 * 60, endMinutes),
													);
													return (
														<ScheduleBlock
															dayOfWeek={slice.dayOfWeek}
															begin={beginClamped}
															end={endClamped}
															name={
																shortenMap[val.name] ??
																val.name.substring(
																	val.type === ScheduleType.CUSTOM ? 6 : 0,
																)
															}
															location={val.location}
															gridHeight={minuteHeight}
															gridWidth={unitWidth}
															key={`${val.name}-${num}-${slice.dayOfWeek}-${beginClamped}-${val.location}`}
															blockColor={
																`${colorList[
																	parseInt(md5(val.name).substr(0, 6), 16) %
																		colorList.length
																]}${enableNewUI ? "33" : ""}`
															}
															textColor={enableNewUI ? colorList[parseInt(md5(val.name).substr(0, 6), 16) % colorList.length] : "white"}
															onPress={() => {
																setEditingParams({
																	name: val.name,
																	location: val.location,
																	week: num,
																	dayOfWeek: slice.dayOfWeek,
																	beginTime: slice.beginTime,
																	endTime: slice.endTime,
																	alias: shortenMap[val.name] ?? "",
																	type: val.type,
																});
																setShowAddModal(true);
															}}
															onLongPress={() => {
																setActionTarget({
																	name: val.name,
																	location: val.location,
																	week: num,
																	dayOfWeek: slice.dayOfWeek,
																	beginTime: slice.beginTime,
																	endTime: slice.endTime,
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
								}}>
								{getStr("hideWeekend")}
							</Text>
							<Switch
								thumbColor={theme.colors.contentBackground}
								trackColor={{true: theme.colors.themePurple}}
								value={hideWeekend}
								onValueChange={(value: boolean) => {
									dispatch(
										configSet({
											key: "hideWeekend",
											value: value,
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
								borderTopWidth: 1,
								borderTopColor: theme.colors.inputBorder,
							}}>
							<Text
								style={{
									color: theme.colors.fontB1,
									fontSize: 16,
								}}>
								{getStr("scheduleFilterOfficial")}
							</Text>
							<Switch
								thumbColor={theme.colors.contentBackground}
								trackColor={{true: theme.colors.themePurple}}
								value={showOfficialSchedule}
								onValueChange={(value: boolean) => {
									dispatch(
										configSet({
											key: "showOfficialSchedule",
											value: value,
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
								borderTopWidth: 1,
								borderTopColor: theme.colors.inputBorder,
							}}>
							<Text
								style={{
									color: theme.colors.fontB1,
									fontSize: 16,
								}}>
								{getStr("scheduleFilterCustom")}
							</Text>
							<Switch
								thumbColor={theme.colors.contentBackground}
								trackColor={{true: theme.colors.themePurple}}
								value={showCustomSchedule}
								onValueChange={(value: boolean) => {
									dispatch(
										configSet({
											key: "showCustomSchedule",
											value: value,
										}),
									);
								}}
							/>
						</View>
						<TouchableOpacity
							style={{
								backgroundColor: theme.colors.contentBackground,
								flexDirection: "row",
								justifyContent: "center",
								paddingHorizontal: 16,
								paddingVertical: 12,
								borderTopWidth: 1,
								borderTopColor: theme.colors.inputBorder,
							}}
							onPress={() => {
								setOpenConfig(false);
								handleExportICS();
							}}>
							<Text
								style={{
									color: theme.colors.themePurple,
									fontSize: 16,
									fontWeight: "500",
								}}>
								{getStr("scheduleExportICS")}
							</Text>
						</TouchableOpacity>
					</TouchableOpacity>
				)}
			</GestureHandlerRootView>
			<ScheduleAddModal
				visible={showAddModal}
				initialParams={editingParams}
				onClose={() => {
					setShowAddModal(false);
					setEditingParams(undefined);
				}}
			/>
			{actionTarget && (
				<View
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						top: 0,
						bottom: 0,
					}}>
					<TouchableOpacity
						activeOpacity={1}
						onPress={() => {
							setActionTarget(undefined);
							setDetailExpanded(false);
							detailAnim.setValue(0);
						}}
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							top: 0,
							bottom: 0,
						}}
					/>
					<View
						style={{
							position: "absolute",
							bottom: 80,
							left: 32,
							right: 32,
						}}>
						<View
							style={{
								backgroundColor: theme.colors.contentBackground,
								borderRadius: 12,
								paddingVertical: 8,
								shadowColor: "#000",
								shadowOpacity: 0.15,
								shadowRadius: 8,
								elevation: 4,
							}}>
							{actionTarget.type !== ScheduleType.EXAM && (
								<>
									{(() => {
										const onceLabel =
											getStr("hideSchedule") + getStr("once");
										return (
											<TouchableOpacity
												onPress={() => handleHide(Choice.ONCE, onceLabel)}
												style={{paddingVertical: 10}}>
												<Text
													style={{
														textAlign: "center",
														fontSize: 16,
														color: theme.colors.fontB1,
													}}>
													{onceLabel}
												</Text>
											</TouchableOpacity>
										);
									})()}
									{actionTarget.type !== ScheduleType.CUSTOM &&
										(() => {
											const repeatLabel =
												getStr("hideSchedule") + getStr("repeatly");
											return (
												<TouchableOpacity
													onPress={() =>
														handleHide(Choice.REPEAT, repeatLabel)
													}
													style={{paddingVertical: 10}}>
													<Text
														style={{
															textAlign: "center",
															fontSize: 16,
															color: theme.colors.fontB1,
														}}>
														{repeatLabel}
													</Text>
												</TouchableOpacity>
											);
										})()}
									{(() => {
										const allLabel =
											(actionTarget.type === ScheduleType.CUSTOM
												? getStr("delSchedule")
												: getStr("hideSchedule")) + getStr("allTime");
										return (
											<TouchableOpacity
												onPress={() => handleHide(Choice.ALL, allLabel)}
												style={{paddingVertical: 10}}>
												<Text
													style={{
														textAlign: "center",
														fontSize: 16,
														color: theme.colors.fontB1,
													}}>
													{allLabel}
												</Text>
											</TouchableOpacity>
										);
									})()}
								</>
							)}
							<TouchableOpacity
								onPress={() => {
									const next = !detailExpanded;
									setDetailExpanded(next);
									Animated.timing(detailAnim, {
										toValue: next ? 1 : 0,
										duration: 300,
										easing: Easing.out(Easing.ease),
										useNativeDriver: false,
									}).start();
								}}
								style={{paddingVertical: 10}}>
								<Text
									style={{
										textAlign: "center",
										fontSize: 16,
										color: theme.colors.themePurple,
									}}>
									{detailExpanded ? getStr("scheduleDetailCollapse") : getStr("scheduleDetailExpand")}
								</Text>
							</TouchableOpacity>
							{actionTarget && detailContentHeight === 0 && (
								<View
									style={{
										position: "absolute",
										opacity: 0,
										left: 0,
										right: 0,
									}}>
									<View
										onLayout={({nativeEvent}) => {
											if (detailContentHeight === 0) {
												setDetailContentHeight(nativeEvent.layout.height);
												if (detailExpanded) {
													detailAnim.setValue(1);
												}
											}
										}}>
										{renderDetailContent()}
									</View>
								</View>
							)}
							<Animated.View
								style={{
									height:
										detailContentHeight === 0
											? 0
											: detailAnim.interpolate({
													inputRange: [0, 1],
													outputRange: [0, Math.min(detailContentHeight, 300)],
											  }),
									overflow: "hidden",
									marginHorizontal: 12,
									marginBottom: 8,
									borderRadius: 8,
									backgroundColor: isDarkMode ? "#2d2d2d" : "#F8F9FA",
									borderLeftWidth: detailExpanded ? 2 : 0,
									borderLeftColor: theme.colors.themePurple,
								}}>
								{renderDetailContent()}
							</Animated.View>
						</View>
					</View>
				</View>
			)}
		</>
	);
};
