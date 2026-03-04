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
	Pressable,
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

interface NewScheduleDefaults {
	week: number;
	dayOfWeek: number;
	periodBegin: number;
	periodEnd: number;
	dateIndex: number;
	beginHour: number;
	beginMinute: number;
	endHour: number;
	endMinute: number;
}

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
		const uploadIconScale = useRef(new Animated.Value(1)).current;

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

		useEffect(() => {
			let animation:
				| Animated.CompositeAnimation
				| undefined;
			if (hasCustomSchedule && !uploadingCustomSchedule) {
				animation = Animated.loop(
					Animated.sequence([
						Animated.timing(uploadIconScale, {
							toValue: 1.12,
							duration: 800,
							easing: Easing.out(Easing.quad),
							useNativeDriver: true,
						}),
						Animated.timing(uploadIconScale, {
							toValue: 1,
							duration: 800,
							easing: Easing.in(Easing.quad),
							useNativeDriver: true,
						}),
					]),
				);
				animation.start();
			} else {
				uploadIconScale.stopAnimation?.(() => {
					uploadIconScale.setValue(1);
				});
			}
			return () => {
				if (animation) {
					animation.stop();
				}
			};
		}, [hasCustomSchedule, uploadingCustomSchedule, uploadIconScale]);

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
								<Animated.View
									style={{
										transform: [{scale: uploadIconScale}],
									}}>
									{uploadingCustomSchedule ? (
										<ActivityIndicator
											size="small"
											color={theme.colors.themePurple}
										/>
									) : (
										<IconUpload width={24} height={24} />
									)}
								</Animated.View>
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

	const bauhausColors = {
		baseBackground: isDarkMode ? "#1A1918" : "#F8F6F2",
		surface: isDarkMode ? "#2A2927" : "#FDFBF7",
		primaryText: isDarkMode ? "#F0EDE9" : "#2C2A28",
		secondaryText: isDarkMode ? "#C8C5C0" : "#5C5A56",
		location: isDarkMode ? "#A688B8" : "#8B6B9C",
		actionGreen: isDarkMode ? "#7AAC96" : "#5B8C7C",
		deleteAccent: isDarkMode ? "#D88C8C" : "#8FBC8F",
		border: isDarkMode ? "#3A3937" : "rgba(255,255,255,0.8)",
		divider: isDarkMode ? "#3A3937" : "rgba(0,0,0,0.04)",
		focusRing: isDarkMode ? "#FFFFFF" : "#2C2A28",
	};

	const windowWidth = Math.floor(Dimensions.get("window").width);
	const windowHeight = Dimensions.get("window").height;
	// 仅用 onLayout 得到的实际高度，避免首屏用估错的高度算出过大的 scrollY
	const [tableHeight, setTableHeight] = useState(0);
	const heightForCalc = tableHeight > 0 ? tableHeight : windowHeight - getStatusBarHeight() - 80;
	// 按上课时间（8:00-21:45）划分为 13.75 小时（表头已移出，可视区域即 ScrollView 高度，不再减 40）
	const exactHourHeight = heightForCalc / 13.75;
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
	const timeStripVerticalPadding = 12; // 时间条上下留白
	const unitWidth = scheduleBodyWidth / (hideWeekend ? 5 : 7);
	const enableNewUI = useSelector((s: State) => s.config.scheduleEnableNewUI);

	// 不展示早于 min(用户本学期最早日程开始时间, 8:00)（向下取整到整点）的时间段
	const displayStartHour = (() => {
		const EIGHT_AM_MINUTES = 8 * 60;
		let earliestMinutes: number | null = null;
		baseSchedule.forEach((val) => {
			if (
				(val.type === ScheduleType.CUSTOM && !showCustomSchedule) ||
				(val.type !== ScheduleType.CUSTOM && !showOfficialSchedule)
			) {
				return;
			}
			val.activeTime.base.forEach((slice) => {
				const week = getWeekFromTime(slice.beginTime, firstDay);
				if (week >= 1 && week <= weekCount) {
					const minutes =
						slice.beginTime.hour() * 60 + slice.beginTime.minute();
					if (
						earliestMinutes === null ||
						minutes < earliestMinutes
					) {
						earliestMinutes = minutes;
					}
				}
			});
		});
		const effectiveMinutes =
			earliestMinutes !== null
				? Math.min(earliestMinutes, EIGHT_AM_MINUTES)
				: EIGHT_AM_MINUTES;
		return Math.floor(effectiveMinutes / 60);
	})();

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
	const [deletingAction, setDeletingAction] = useState(false);

	const themeTransition = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;
	const popupAnim = useRef(new Animated.Value(0)).current;

	const popupBaseBackground = themeTransition.interpolate({
		inputRange: [0, 1],
		outputRange: ["#F8F6F2", "#1A1918"],
	});

	const popupSurfaceBackground = themeTransition.interpolate({
		inputRange: [0, 1],
		outputRange: ["#FDFBF7", "#2A2927"],
	});

	useEffect(() => {
		Animated.timing(themeTransition, {
			toValue: isDarkMode ? 1 : 0,
			duration: 300,
			easing: Easing.out(Easing.ease),
			useNativeDriver: false,
		}).start();
	}, [isDarkMode, themeTransition]);

	useEffect(() => {
		if (actionTarget) {
			popupAnim.setValue(0);
			Animated.timing(popupAnim, {
				toValue: 1,
				duration: 200,
				easing: Easing.out(Easing.ease),
				useNativeDriver: true,
			}).start();
		}
	}, [actionTarget, popupAnim]);

	const nullAlias = (str: string | undefined) => {
		if (str === undefined) {
			return true;
		}
		return str.length === 0;
	};

	const isCustomLike = (target: ScheduleEditParams | undefined) =>
		target !== undefined &&
		(target.type === ScheduleType.CUSTOM || target.category === "个人日历");

	const handleHide = async (choice: Choice, label: string) => {
		if (!actionTarget) {
			return;
		}
		if (actionTarget.type === ScheduleType.EXAM) {
			return;
		}
		try {
			if (isCustomLike(actionTarget)) {
				setDeletingAction(true);
				const matchedSchedule = baseSchedule.find(
					(s) =>
						s.name === actionTarget.name &&
						s.location === actionTarget.location &&
						s.type === actionTarget.type &&
						(actionTarget.category === undefined ||
							s.category === actionTarget.category),
				);

				if (matchedSchedule) {
					if (choice === Choice.ALL) {
						await helper.deleteCustomSchedule([matchedSchedule]);
					} else if (choice === Choice.ONCE) {
						const matchedSlice = matchedSchedule.activeTime.base.find(
							(slice) =>
								slice.dayOfWeek === actionTarget.dayOfWeek &&
								slice.beginTime.isSame(actionTarget.beginTime, "minute") &&
								slice.endTime.isSame(actionTarget.endTime, "minute"),
						);

						if (matchedSlice) {
							await helper.deleteCustomSchedule([
								{
									...matchedSchedule,
									activeTime: {base: [matchedSlice]},
									delOrHideTime: {base: []},
								},
							]);
						}
					}
				}
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
			if (Platform.OS === "android") {
				ToastAndroid.showWithGravity(
					`已成功${label}`,
					ToastAndroid.SHORT,
					ToastAndroid.TOP,
				);
			}
		} finally {
			setDeletingAction(false);
		}
	};

	const renderDetailContent = () => {
		if (!actionTarget) {
			return null;
		}
		const detailTextColor = bauhausColors.primaryText;
		const detailSecondaryColor = bauhausColors.secondaryText;
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
						color: bauhausColors.location,
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
	const [currentWeekIndex, setCurrentWeekIndex] = useState(nowWeek - 1);
	const [addDefaults, setAddDefaults] = useState<NewScheduleDefaults | undefined>(
		undefined,
	);

	const renderActionButton = (
		label: string,
		textColor: string,
		backgroundLight: string,
		backgroundDark: string,
		onPress: () => void,
		disabled: boolean = false,
		loading: boolean = false,
	) => (
		<Pressable
			onPress={onPress}
			disabled={disabled}
			style={(state) => {
				const {pressed} = state;
				const focused =
					(state as unknown as {focused?: boolean}).focused ?? false;
				return {
					marginTop: 8,
					paddingVertical: pressed ? 11 : 10,
					paddingHorizontal: 12,
					borderRadius: 4,
					backgroundColor: isDarkMode ? backgroundDark : backgroundLight,
					alignItems: "center",
					justifyContent: "center",
					transform: pressed ? [{translateY: 1}] : [],
					borderWidth: focused ? 2 : 1,
					borderColor: focused ? bauhausColors.focusRing : "transparent",
				};
			}}>
			{loading ? (
				<ActivityIndicator size="small" color={textColor} />
			) : (
				<Text
					style={{
						fontSize: 14,
						fontWeight: "500",
						color: textColor,
					}}>
					{label}
				</Text>
			)}
		</Pressable>
	);

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
				onPressAdd={() => {
					setEditingParams(undefined);
					setAddDefaults(undefined);
					setShowAddModal(true);
				}}
				onPressUpload={handleUploadCustomSchedule}
				hasCustomSchedule={hasCustomScheduleInCurrentSemester}
				uploadingCustomSchedule={uploadingCustomSchedule}
			/>
			<GestureHandlerRootView style={{flex: 1}}>
				{/* 冷冻第一行：周一、周二、周三……固定在顶部，垂直滚动时保持可见 */}
				<View
					style={{
						flexDirection: "row",
						height: 40,
						backgroundColor: theme.colors.contentBackground,
					}}>
					<View style={{width: timeLabelWidth + timeAxisWidth}} />
					<View
						style={{
							flexDirection: "row",
							width: scheduleBodyWidth,
							flex: 1,
						}}>
						{Array.from(new Array(hideWeekend ? 5 : 7)).map((_, index) => (
							<View
								style={{
									flex: 1,
									padding: 4,
									alignItems: "center",
									justifyContent: "center",
								}}
								key={`frozen-${index + 1}`}>
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
											today === index + 1
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
										.add(currentWeekIndex * 7 + index, "day")
										.format("MM/DD")}
								</Text>
							</View>
						))}
					</View>
				</View>
				<ScrollView
					style={{flex: 1}}
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
					<View
						style={{
							flexDirection: "row",
							paddingVertical: timeStripVerticalPadding,
						}}>
						{/* Timetable on the left: displayStartHour - 24:00 */}
						<View
							style={{
								width: timeLabelWidth,
								height: (24 - displayStartHour) * hourHeight,
							}}>
							{Array.from(
								new Array(25 - displayStartHour),
								(_, k) => displayStartHour + k,
							).map((hour) => (
								<Text
									key={`time-label-${hour}`}
									style={{
										position: "absolute",
										top: (hour - displayStartHour) * hourHeight - 6,
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
								height: (24 - displayStartHour) * hourHeight,
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
								if (minutes < displayStartHour * 60) {
									return null;
								}
								return (
									<View
										key={`axis-begin-${idx}`}
										style={{
											position: "absolute",
											left: timeAxisWidth / 2 - 3,
											top:
												(minutes - displayStartHour * 60) *
													minuteHeight -
												3,
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
								if (minutes < displayStartHour * 60) {
									return null;
								}
								return (
									<View
										key={`axis-end-${idx}`}
										style={{
											position: "absolute",
											left: timeAxisWidth / 2 - 3,
											top:
												(minutes - displayStartHour * 60) *
													minuteHeight -
												3,
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
							{Array.from(
								new Array(25 - displayStartHour),
								(_, k) => displayStartHour + k,
							).map((hour) => (
								<View
									key={`hour-line-${hour}`}
									style={{
										backgroundColor: theme.colors.inputBorder,
										height: 1,
										position: "absolute",
										left: 0,
										right: 0,
										top: (hour - displayStartHour) * hourHeight,
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
								renderItem={({item}) => (
									<View
										style={{
											height: (24 - displayStartHour) * hourHeight,
											width: scheduleBodyWidth,
										}}>
										<View
											style={{
												height: (24 - displayStartHour) * hourHeight,
												width: scheduleBodyWidth,
											}}>
											<TouchableOpacity
												activeOpacity={1}
												style={{
													position: "absolute",
													left: 0,
													right: 0,
													top: 0,
													bottom: 0,
												}}
												onPressIn={(e) => {
													const {locationX, locationY} = e.nativeEvent;
													const totalColumns = hideWeekend ? 5 : 7;
													const columnWidth = unitWidth;
													let dayIndex = Math.floor(locationX / columnWidth);
													if (dayIndex < 0) {
														dayIndex = 0;
													} else if (dayIndex >= totalColumns) {
														dayIndex = totalColumns - 1;
													}
													const dayOfWeek = dayIndex + 1;

													const totalMinutesInDay = 24 * 60;
													let minuteOfDay =
														displayStartHour * 60 +
														Math.floor(locationY / minuteHeight);
													if (minuteOfDay < 0) {
														minuteOfDay = 0;
													} else if (minuteOfDay >= totalMinutesInDay) {
														minuteOfDay = totalMinutesInDay - 1;
													}

													const findPeriodByMinute = (m: number) => {
														for (let i = 1; i < beginTime.length; i++) {
															const beginStr = beginTime[i];
															const endStr = endTime[i];
															if (!beginStr || !endStr) {
																continue;
															}
															const [bh, bm] = beginStr.split(":");
															const [eh, em] = endStr.split(":");
															const start =
																parseInt(bh, 10) * 60 + parseInt(bm, 10);
															const end =
																parseInt(eh, 10) * 60 + parseInt(em, 10);
															if (m >= start && m < end) {
																return i;
															}
														}
														return 1;
													};

													const periodBegin = findPeriodByMinute(minuteOfDay);
													const periodEnd = Math.min(
														periodBegin + 1,
														endTime.length - 1,
													);

													const beginStr = beginTime[periodBegin] || "08:00";
													const endStr = endTime[periodEnd] || "08:45";
													const [bh, bm] = beginStr.split(":");
													const [eh, em] = endStr.split(":");

													const week = Math.max(
														1,
														Math.min(weekCount, currentWeekIndex + 1),
													);
													const dateIndex =
														(week - 1) * 7 + (dayOfWeek - 1);

													setAddDefaults({
														week,
														dayOfWeek,
														periodBegin,
														periodEnd,
														dateIndex,
														beginHour: parseInt(bh, 10),
														beginMinute: parseInt(bm, 10),
														endHour: parseInt(eh, 10),
														endMinute: parseInt(em, 10),
													});
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
													const startThreshold = displayStartHour * 60;
													const beginMinutes =
														slice.beginTime.hour() * 60 +
														slice.beginTime.minute();
													const endMinutes =
														slice.endTime.hour() * 60 +
														slice.endTime.minute();
													if (endMinutes <= startThreshold) {
														return null;
													}
													// 在“从 displayStartHour 开始”的坐标系中的 begin/end（分钟）
													const visibleBegin = Math.max(
														0,
														beginMinutes - startThreshold,
													);
													const visibleEnd = endMinutes - startThreshold;
													return (
														<ScheduleBlock
															dayOfWeek={slice.dayOfWeek}
															begin={visibleBegin}
															end={visibleEnd}
															name={
																shortenMap[val.name] ??
																val.name.substring(
																	val.type === ScheduleType.CUSTOM ? 6 : 0,
																)
															}
															location={val.location}
															gridHeight={minuteHeight}
															gridWidth={unitWidth}
															key={`${val.name}-${num}-${slice.dayOfWeek}-${beginMinutes}-${val.location}`}
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
																	category: val.category,
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
																	category: val.category,
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
									setCurrentWeekIndex(index);
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
				defaultDayOfWeek={addDefaults?.dayOfWeek}
				defaultDateIndex={addDefaults?.dateIndex}
				defaultPeriodBegin={addDefaults?.periodBegin}
				defaultPeriodEnd={addDefaults?.periodEnd}
				defaultBeginHour={addDefaults?.beginHour}
				defaultBeginMinute={addDefaults?.beginMinute}
				defaultEndHour={addDefaults?.endHour}
				defaultEndMinute={addDefaults?.endMinute}
				onClose={() => {
					setShowAddModal(false);
					setEditingParams(undefined);
					setAddDefaults(undefined);
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
						alignItems: "center",
						justifyContent: "center",
					}}>
					<TouchableOpacity
						activeOpacity={1}
						onPress={() => {
							setActionTarget(undefined);
						}}
						style={{
							position: "absolute",
							left: 0,
							right: 0,
							top: 0,
							bottom: 0,
							backgroundColor: "#00000055",
						}}
					/>
					<Animated.View
						style={{
							width: Math.min(400, windowWidth - 32),
							borderRadius: 24,
							padding: 18,
							backgroundColor: popupBaseBackground,
							borderWidth: 1,
							borderColor: bauhausColors.border,
							opacity: popupAnim,
							transform: [
								{
									scale: popupAnim.interpolate({
										inputRange: [0, 1],
										outputRange: [0.95, 1],
									}),
								},
								{
									translateY: popupAnim.interpolate({
										inputRange: [0, 1],
										outputRange: [20, 0],
									}),
								},
							],
						}}>
						<Text
							style={{
								textAlign: "center",
								fontSize: 16,
								fontWeight: "600",
								color: bauhausColors.primaryText,
								marginBottom: 12,
							}}>
							{"日程详情"}
						</Text>
						<Animated.View
							style={{
								backgroundColor: popupSurfaceBackground,
								borderRadius: 16,
								padding: 16,
								borderWidth: 1,
								borderColor: bauhausColors.border,
								marginBottom: 16,
							}}>
							{renderDetailContent()}
						</Animated.View>
							<View>
								{renderActionButton(
									(isCustomLike(actionTarget)
										? getStr("delSchedule")
										: getStr("hideSchedule")) + getStr("once"),
									bauhausColors.actionGreen,
									"rgba(91,140,124,0.10)",
									"rgba(122,172,150,0.16)",
									() => {
										const onceLabel =
											(isCustomLike(actionTarget)
												? getStr("delSchedule")
												: getStr("hideSchedule")) + getStr("once");
										void handleHide(Choice.ONCE, onceLabel);
									},
									deletingAction,
									deletingAction && isCustomLike(actionTarget),
								)}
								{!isCustomLike(actionTarget) &&
									renderActionButton(
										getStr("hideSchedule") + getStr("repeatly"),
										bauhausColors.actionGreen,
										"rgba(91,140,124,0.10)",
										"rgba(122,172,150,0.16)",
										() => {
											const repeatLabel =
												getStr("hideSchedule") + getStr("repeatly");
											handleHide(Choice.REPEAT, repeatLabel);
										},
									)}
								{renderActionButton(
									(isCustomLike(actionTarget)
										? getStr("delSchedule")
										: getStr("hideSchedule")) + getStr("allTime"),
									bauhausColors.deleteAccent,
									"rgba(143,188,143,0.10)",
									"rgba(216,140,140,0.16)",
									() => {
										const allLabel =
											(isCustomLike(actionTarget)
												? getStr("delSchedule")
												: getStr("hideSchedule")) + getStr("allTime");
										void handleHide(Choice.ALL, allLabel);
									},
									deletingAction,
									deletingAction && isCustomLike(actionTarget),
								)}
							</View>
					</Animated.View>
				</View>
			)}
		</>
	);
};
