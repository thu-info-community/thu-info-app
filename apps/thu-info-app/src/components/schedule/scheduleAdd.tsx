import {useEffect, useState} from "react";
import {
	Alert,
	Dimensions,
	Modal,
	ScrollView,
	Switch,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {
	getOverlappedBlock,
	Schedule,
	scheduleTimeAdd,
	ScheduleType,
	TimeSlice,
	getBeginPeriod,
	getEndPeriod,
	getWeekFromTime,
} from "@thu-info/lib/src/models/schedule/schedule";
import dayjs from "dayjs";
import {State} from "../../redux/store";
import {
	Choice,
	scheduleAddCustom,
	scheduleDelOrHide,
	scheduleUpdateAlias,
	scheduleUpdateLocation,
	scheduleUpdateCustomTime,
} from "../../redux/slices/schedule";
import {useColorScheme} from "react-native";
import {BottomPopupTriggerView, RoundedView} from "../views";
import IconRight from "../../assets/icons/IconRight";
import {explainPeriod, explainWeekList} from "../../utils/calendar";
import IconSelected from "../../assets/icons/IconSelected";
import IconNotSelected from "../../assets/icons/IconNotSelected";
import ScrollPicker from "react-native-wheel-scrollview-picker";

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

export interface ScheduleEditParams {
	name: string;
	location: string;
	week: number;
	dayOfWeek: number;
	beginTime: dayjs.Dayjs;
	endTime: dayjs.Dayjs;
	alias: string;
	type: ScheduleType;
	category?: string;
	activeWeeks?: number[];
}

interface ScheduleAddModalProps {
	visible: boolean;
	onClose: () => void;
	initialParams?: ScheduleEditParams;
	defaultDayOfWeek?: number;
	defaultDateIndex?: number;
	defaultPeriodBegin?: number;
	defaultPeriodEnd?: number;
	defaultBeginHour?: number;
	defaultBeginMinute?: number;
	defaultEndHour?: number;
	defaultEndMinute?: number;
}

export const ScheduleAddModal = ({
	visible,
	onClose,
	initialParams,
	defaultDayOfWeek,
	defaultDateIndex,
	defaultPeriodBegin,
	defaultPeriodEnd,
	defaultBeginHour,
	defaultBeginMinute,
	defaultEndHour,
	defaultEndMinute,
}: ScheduleAddModalProps) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const isLightMode = themeName !== "dark";

	const modalBackgroundColor = isLightMode
		? "#F8F6F2"
		: theme.colors.contentBackground;
	const cardBackgroundColor = isLightMode
		? "#FDFBF7"
		: theme.colors.contentBackground;
	const tabSelectedBackgroundColor = isLightMode
		? "#8B6B9C"
		: theme.colors.contentBackground;
	const tabUnselectedBackgroundColor = isLightMode
		? "#F0EEEA"
		: theme.colors.themeGrey;
	const tabSelectedTextColor = isLightMode ? "#FFFFFF" : theme.colors.fontB1;
	const tabUnselectedTextColor = isLightMode
		? "#5C5A56"
		: theme.colors.fontB1;
	const modalTextColor = isLightMode ? "#5C5A56" : theme.colors.fontB1;
	const modalTitleColor = isLightMode ? "#2C2A28" : theme.colors.text;

	const params = initialParams;

	const scheduleList = useSelector((s: State) => s.schedule.baseSchedule);

	const weekCount = useSelector((s: State) => s.config.weekCount);
	const firstDay = useSelector((s: State) => s.config.firstDay);

	const dispatch = useDispatch();

	const [weeks, setWeeks] = useState(
		params?.activeWeeks
			? params.activeWeeks
			: Array.from(new Array(weekCount), (_, k) => k + 1),
	);

	const [popupWeeks, setPopupWeeks] = useState(
		params?.activeWeeks
			? params.activeWeeks
			: Array.from(new Array(weekCount), (_, k) => k + 1),
	);

	const popupIsAllOdd =
		String([...popupWeeks].sort((a, b) => a - b)) ===
		String(
			Array.from(new Array(Math.ceil(weekCount / 2)), (_, k) => k * 2 + 1),
		);

	const popupIsAllEven =
		String([...popupWeeks].sort((a, b) => a - b)) ===
		String(
			Array.from(new Array(Math.floor(weekCount / 2)), (_, k) => k * 2 + 2),
		);

	const popupIsAllWeeks =
		String([...popupWeeks].sort((a, b) => a - b)) ===
		String(Array.from(new Array(Math.floor(weekCount)), (_, k) => k + 1));

	const popupIsEmptyWeeks = String([...popupWeeks]) === String([]);

	const [day, setDay] = useState(
		params?.dayOfWeek ?? defaultDayOfWeek ?? 1,
	);
	const [popupDay, setPopupDay] = useState(
		params?.dayOfWeek ?? defaultDayOfWeek ?? 1,
	);

	const [periodBegin, setPeriodBegin] = useState(
		params && params.beginTime
			? getBeginPeriod(params.beginTime)
			: defaultPeriodBegin ?? 1,
	);
	const [periodEnd, setPeriodEnd] = useState(
		params && params.endTime
			? getEndPeriod(params.endTime)
			: defaultPeriodEnd ?? 14,
	);

	const [popupPeriodBegin, setPopupPeriodBegin] = useState(
		params && params.beginTime
			? getBeginPeriod(params.beginTime)
			: defaultPeriodBegin ?? 1,
	);
	const [popupPeriodEnd, setPopupPeriodEnd] = useState(
		params && params.endTime
			? getEndPeriod(params.endTime)
			: defaultPeriodEnd ?? 14,
	);

	const [useCustomDateTime, setUseCustomDateTime] = useState(false);

	const totalDays = weekCount * 7;
	const todayIndex = (() => {
		const today = dayjs().startOf("day");
		const semesterStart = dayjs(firstDay).startOf("day");
		const diff = today.diff(semesterStart, "day");
		if (diff >= 0 && diff < totalDays) {
			return diff;
		}
		return 0;
	})();
	const [dateIndex, setDateIndex] = useState(
		defaultDateIndex ?? todayIndex,
	);
	const [popupDateIndex, setPopupDateIndex] = useState(
		defaultDateIndex ?? todayIndex,
	);

	const [beginHour, setBeginHour] = useState(defaultBeginHour ?? 8);
	const [beginMinute, setBeginMinute] = useState(
		defaultBeginMinute ?? 0,
	);
	const [endHour, setEndHour] = useState(defaultEndHour ?? 8);
	const [endMinute, setEndMinute] = useState(defaultEndMinute ?? 45);

	const [popupBeginHour, setPopupBeginHour] = useState(
		defaultBeginHour ?? 8,
	);
	const [popupBeginMinute, setPopupBeginMinute] = useState(
		defaultBeginMinute ?? 0,
	);
	const [popupEndHour, setPopupEndHour] = useState(
		defaultEndHour ?? 8,
	);
	const [popupEndMinute, setPopupEndMinute] = useState(
		defaultEndMinute ?? 45,
	);

	const [repeatWeekly, setRepeatWeekly] = useState(false);

	const [title, setTitle] = useState(params?.alias ?? "");
	const [locale, setLocale] = useState(params?.location ?? "");

	useEffect(() => {
		if (!visible || params !== undefined) {
			return;
		}

		const allWeeks = Array.from(new Array(weekCount), (_, k) => k + 1);
		setWeeks(allWeeks);
		setPopupWeeks(allWeeks);

		const effectiveDay = defaultDayOfWeek ?? 1;
		setDay(effectiveDay);
		setPopupDay(effectiveDay);

		const initialPeriodBegin = defaultPeriodBegin ?? 1;
		const initialPeriodEnd = defaultPeriodEnd ?? 14;
		setPeriodBegin(initialPeriodBegin);
		setPeriodEnd(initialPeriodEnd);
		setPopupPeriodBegin(initialPeriodBegin);
		setPopupPeriodEnd(initialPeriodEnd);

		const idx = defaultDateIndex ?? todayIndex;
		setDateIndex(idx);
		setPopupDateIndex(idx);

		const bHour = defaultBeginHour ?? 8;
		const bMinute = defaultBeginMinute ?? 0;
		const eHour = defaultEndHour ?? 8;
		const eMinute = defaultEndMinute ?? 45;

		setBeginHour(bHour);
		setBeginMinute(bMinute);
		setEndHour(eHour);
		setEndMinute(eMinute);

		setPopupBeginHour(bHour);
		setPopupBeginMinute(bMinute);
		setPopupEndHour(eHour);
		setPopupEndMinute(eMinute);

		setUseCustomDateTime(false);
		setRepeatWeekly(false);
		setTitle("");
		setLocale("");
	}, [
		visible,
		params,
		weekCount,
		todayIndex,
		defaultDayOfWeek,
		defaultPeriodBegin,
		defaultPeriodEnd,
		defaultDateIndex,
		defaultBeginHour,
		defaultBeginMinute,
		defaultEndHour,
		defaultEndMinute,
	]);

	// Prepare for modify custom schedule's time
	// For custom schedule editing, time IS editable; for non-custom, hide the section entirely
	const isEditingCustom = params !== undefined && params.type === ScheduleType.CUSTOM;
	const isNonCustomEdit = params !== undefined && params.type !== ScheduleType.CUSTOM;

	const dateTimeValid = (() => {
		if (!useCustomDateTime) {
			return true;
		}
		if (totalDays <= 0) {
			return false;
		}
		const baseDate = dayjs(firstDay).add(dateIndex, "day");
		const begin = baseDate
			.hour(beginHour)
			.minute(beginMinute)
			.second(0)
			.millisecond(0);
		const end = baseDate
			.hour(endHour)
			.minute(endMinute)
			.second(0)
			.millisecond(0);
		return end.isAfter(begin);
	})();

	const valid =
		(title.trim().length > 0 || params !== undefined) &&
		(isNonCustomEdit || (!useCustomDateTime ? weeks.length > 0 : dateTimeValid));

	const windowWidth = Dimensions.get("window").width;
	const weekButtonWidth = (windowWidth - 24) / 4 - 6 - 1;

	const handleSave = () => {
		if (!valid) {
			return;
		}

		if (params !== undefined) {
			// 代表是在修改现有计划
			if (title.length === 0) {
				dispatch(scheduleUpdateAlias([params.name, undefined]));
			} else {
				dispatch(scheduleUpdateAlias([params.name, title]));
			}
			dispatch(scheduleUpdateLocation([params.name, locale]));

			if (isEditingCustom) {
				// 修改自定义计划的时间
				const newActiveTime: {base: TimeSlice[]} = {base: []};

				if (!useCustomDateTime) {
					weeks.forEach((week) => {
						const courseDate = dayjs(firstDay)
							.add((week - 1) * 7, "day")
							.add(day - 1, "day");

						const beginTimeStr = beginTime[periodBegin] || "08:00";
						const endTimeStr = endTime[periodEnd] || "08:45";

						scheduleTimeAdd(newActiveTime, {
							dayOfWeek: day,
							beginTime: dayjs(
								`${courseDate.format("YYYY-MM-DD")} ${beginTimeStr}`,
							),
							endTime: dayjs(
								`${courseDate.format("YYYY-MM-DD")} ${endTimeStr}`,
							),
						});
					});
				} else {
					if (totalDays <= 0) {
						Alert.alert(
							getStr("scheduleInvalidTimeTitle" as any),
							getStr("scheduleInvalidTimeMessage" as any),
						);
						return;
					}

					const baseDate = dayjs(firstDay)
						.add(dateIndex, "day")
						.startOf("day");
					const baseBegin = baseDate
						.hour(beginHour)
						.minute(beginMinute)
						.second(0)
						.millisecond(0);
					const baseEnd = baseDate
						.hour(endHour)
						.minute(endMinute)
						.second(0)
						.millisecond(0);

					if (!baseEnd.isAfter(baseBegin)) {
						Alert.alert(
							getStr("scheduleInvalidTimeTitle" as any),
							getStr("scheduleInvalidTimeMessage" as any),
						);
						return;
					}

					const baseDayOfWeek =
						baseBegin.day() === 0 ? 7 : baseBegin.day();

					if (!repeatWeekly) {
						scheduleTimeAdd(newActiveTime, {
							dayOfWeek: baseDayOfWeek,
							beginTime: baseBegin,
							endTime: baseEnd,
						});
					} else {
						const baseWeek = getWeekFromTime(baseBegin, firstDay);

						if (baseWeek > weekCount) {
							scheduleTimeAdd(newActiveTime, {
								dayOfWeek: baseDayOfWeek,
								beginTime: baseBegin,
								endTime: baseEnd,
							});
						} else {
							const startWeek = Math.max(baseWeek, 1);
							for (let w = startWeek; w <= weekCount; w++) {
								const offset = w - baseWeek;
								const begin = baseBegin.add(offset, "week");
								const end = baseEnd.add(offset, "week");
								scheduleTimeAdd(newActiveTime, {
									dayOfWeek: baseDayOfWeek,
									beginTime: begin,
									endTime: end,
								});
							}
						}
					}
				}

				dispatch(scheduleUpdateCustomTime([params.name, newActiveTime]));
			}

			onClose();
			return;
		}

		// TODO: 需要禁止添加和已有计划重名的计划
		const newSchedule: Schedule = {
			name: title || params?.name || "",
			location: locale,
			activeTime: {base: []},
			delOrHideTime: {base: []},
			type: ScheduleType.CUSTOM,
			hash: "",
		};

		if (!useCustomDateTime) {
			weeks.forEach((week) => {
				const courseDate = dayjs(firstDay)
					.add((week - 1) * 7, "day")
					.add(day - 1, "day");

				const beginTimeStr = beginTime[periodBegin] || "08:00";
				const endTimeStr = endTime[periodEnd] || "08:45";

				scheduleTimeAdd(newSchedule.activeTime, {
					dayOfWeek: day,
					beginTime: dayjs(
						`${courseDate.format("YYYY-MM-DD")} ${beginTimeStr}`,
					),
					endTime: dayjs(
						`${courseDate.format("YYYY-MM-DD")} ${endTimeStr}`,
					),
				});
			});
		} else {
			if (totalDays <= 0) {
				Alert.alert(
					getStr("scheduleInvalidTimeTitle" as any),
					getStr("scheduleInvalidTimeMessage" as any),
				);
				return;
			}

			const baseDate = dayjs(firstDay)
				.add(dateIndex, "day")
				.startOf("day");
			const baseBegin = baseDate
				.hour(beginHour)
				.minute(beginMinute)
				.second(0)
				.millisecond(0);
			const baseEnd = baseDate
				.hour(endHour)
				.minute(endMinute)
				.second(0)
				.millisecond(0);

			if (!baseEnd.isAfter(baseBegin)) {
				Alert.alert(
					getStr("scheduleInvalidTimeTitle" as any),
					getStr("scheduleInvalidTimeMessage" as any),
				);
				return;
			}

			const baseDayOfWeek =
				baseBegin.day() === 0 ? 7 : baseBegin.day();

			if (!repeatWeekly) {
				scheduleTimeAdd(newSchedule.activeTime, {
					dayOfWeek: baseDayOfWeek,
					beginTime: baseBegin,
					endTime: baseEnd,
				});
			} else {
				const baseWeek = getWeekFromTime(baseBegin, firstDay);

				if (baseWeek > weekCount) {
					scheduleTimeAdd(newSchedule.activeTime, {
						dayOfWeek: baseDayOfWeek,
						beginTime: baseBegin,
						endTime: baseEnd,
					});
				} else {
					const startWeek = Math.max(baseWeek, 1);
					for (let w = startWeek; w <= weekCount; w++) {
						const offset = w - baseWeek;
						const begin = baseBegin.add(offset, "week");
						const end = baseEnd.add(offset, "week");
						scheduleTimeAdd(newSchedule.activeTime, {
							dayOfWeek: baseDayOfWeek,
							beginTime: begin,
							endTime: end,
						});
					}
				}
			}
		}

		let overlapList: [string, ScheduleType, TimeSlice][] =
			getOverlappedBlock(newSchedule, scheduleList);

		if (overlapList.length) {
			Alert.alert(
				getStr("scheduleConflict"),
				getStr("customIntro") +
					overlapList
						.map(
							(val) =>
								"「" +
								val[0] +
								"」\n" +
								getStr("weekNumPrefix") +
								getWeekFromTime(val[2].beginTime, firstDay) +
								getStr("weekNumSuffix") +
								" " +
								getStr("dayOfWeek")[val[2].dayOfWeek] +
								" " +
								(() => {
									const beginPeriod = getBeginPeriod(
										val[2].beginTime,
									);
									const endPeriod = getEndPeriod(
										val[2].endTime,
									);
									if (beginPeriod > 0 && endPeriod > 0) {
										return (
											getStr("periodNumPrefix") +
											beginPeriod +
											(beginPeriod === endPeriod
												? ""
												: " ~ " + endPeriod) +
											getStr("periodNumSuffix")
										);
									}
									return (
										val[2].beginTime.format("HH:mm") +
										" ~ " +
										val[2].endTime.format("HH:mm")
									);
								})(),
						)
						.join("\n\n") +
					getStr("customText"),
				[
					{
						text: getStr("confirm"),
						onPress: () => {
							overlapList.forEach((val) => {
								dispatch(
									scheduleDelOrHide([val[0], val[2], Choice.ONCE]),
								);
							});
							dispatch(scheduleAddCustom(newSchedule));
							onClose();
						},
					},
					{
						text: getStr("cancel"),
					},
				],
			);
		} else {
			dispatch(scheduleAddCustom(newSchedule));
			onClose();
		}
	};

	const windowHeight = Dimensions.get("window").height;
	const modalCardMaxHeight = Math.floor(windowHeight * 0.85);
	const scrollMaxHeight = modalCardMaxHeight - 56 - 24;

	return (
		<Modal
			visible={visible}
			animationType="fade"
			onRequestClose={onClose}
			transparent={true}>
			<View style={{flex: 1, justifyContent: "flex-start"}}>
				<TouchableOpacity
					activeOpacity={1}
					onPress={onClose}
					style={{
						position: "absolute",
						left: 0,
						right: 0,
						top: 0,
						bottom: 0,
						backgroundColor: "rgba(44, 42, 40, 0.42)",
					}}
				/>
				<TouchableOpacity
					activeOpacity={1}
					onPress={() => {}}
					style={{
						marginTop: 48,
						marginHorizontal: 20,
						marginBottom: 24,
						borderRadius: 12,
						backgroundColor: modalBackgroundColor,
						maxHeight: modalCardMaxHeight,
						overflow: "hidden",
					}}>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							justifyContent: "space-between",
							paddingHorizontal: 20,
							paddingVertical: 14,
							borderBottomWidth: 1,
							borderBottomColor: theme.colors.themeGrey,
						}}>
						<TouchableOpacity
							onPress={onClose}
							style={{paddingHorizontal: 8, paddingVertical: 4}}>
							<Text
								style={{
									color: modalTextColor,
									fontSize: 16,
									fontWeight: "600",
								}}>
								{getStr("cancel")}
							</Text>
						</TouchableOpacity>
						<Text
							style={{
								color: modalTitleColor,
								fontSize: 18,
								fontWeight: "700",
							}}>
							{getStr(
								params === undefined ? "scheduleAddCustom" : "scheduleEdit",
							)}
						</Text>
						<TouchableOpacity
							disabled={!valid}
							onPress={handleSave}
							style={{
								opacity: valid ? 1 : 0.5,
								paddingHorizontal: 8,
								paddingVertical: 4,
							}}>
							<Text
								style={{
									color: valid ? "#5B8C7C" : theme.colors.themeGrey,
									fontSize: 16,
									fontWeight: "600",
								}}>
								{getStr("save")}
							</Text>
						</TouchableOpacity>
					</View>
					<ScrollView
						style={{maxHeight: scrollMaxHeight}}
						contentContainerStyle={{paddingHorizontal: 16, paddingVertical: 20}}
						showsVerticalScrollIndicator={true}>
			<RoundedView
				style={{
					marginTop: 8,
					paddingHorizontal: 18,
					paddingVertical: 20,
					backgroundColor: cardBackgroundColor,
				}}>
				<TextInput
					style={{
						color: modalTextColor,
						padding: 0,
						fontSize: 16,
					}}
					placeholder={params?.name ?? getStr("title")}
					placeholderTextColor={modalTextColor}
					value={title}
					onChangeText={setTitle}
				/>
				<View
					style={{
						height: 1,
						backgroundColor: theme.colors.themeGrey,
						marginVertical: 12,
					}}
				/>
				<TextInput
					style={{
						color: modalTextColor,
						padding: 0,
						fontSize: 16,
					}}
					placeholder={getStr("location")}
					placeholderTextColor={modalTextColor}
					value={locale}
					onChangeText={setLocale}
				/>
			</RoundedView>
			{/* Time editing section: shown when adding new schedule or editing custom schedule.
			    Hidden entirely for non-custom schedule edits since time slots cannot be modified. */}
			{!isNonCustomEdit && (
			<RoundedView
				style={{
					marginTop: 20,
					paddingHorizontal: 18,
					paddingVertical: 20,
					backgroundColor: cardBackgroundColor,
				}}>
				<View
						style={{
							flexDirection: "row",
							marginBottom: 12,
							alignSelf: "center",
							backgroundColor: tabUnselectedBackgroundColor,
							borderRadius: 999,
							padding: 2,
						}}>
						<TouchableOpacity
							style={{
								paddingVertical: 6,
								paddingHorizontal: 12,
								borderRadius: 16,
								backgroundColor: !useCustomDateTime
									? tabSelectedBackgroundColor
									: "transparent",
							}}
							onPress={() => setUseCustomDateTime(false)}>
							<Text
								style={{
									color: !useCustomDateTime
										? tabSelectedTextColor
										: tabUnselectedTextColor,
									fontSize: 14,
								}}>
								{getStr("scheduleAddModeWeekPeriod" as any)}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={{
								paddingVertical: 6,
								paddingHorizontal: 12,
								borderRadius: 16,
								backgroundColor: useCustomDateTime
									? tabSelectedBackgroundColor
									: "transparent",
							}}
							onPress={() => setUseCustomDateTime(true)}>
							<Text
								style={{
									color: useCustomDateTime
										? tabSelectedTextColor
										: tabUnselectedTextColor,
									fontSize: 14,
								}}>
								{getStr("scheduleAddModeDateTime" as any)}
							</Text>
						</TouchableOpacity>
					</View>

				{!useCustomDateTime && (
					<>
						<BottomPopupTriggerView
							popupTitle={explainWeekList(popupWeeks)}
							popupCancelable={true}
							popupContent={
								<View>
									<View
										style={{
											marginHorizontal: 12,
											marginTop: 7,
											flexDirection: "row",
											flexWrap: "wrap",
										}}>
										{Array.from(
											new Array(weekCount),
											(_, k) => k + 1,
										).map((week) => (
											<TouchableOpacity
												style={{
													width: weekButtonWidth,
													marginHorizontal: 3,
													marginVertical: 4,
													alignItems: "center",
													backgroundColor: popupWeeks.includes(week)
														? theme.colors.themePurple
														: undefined,
													borderRadius: 8,
												}}
												onPress={() => {
													setPopupWeeks((a) => {
														if (a.includes(week)) {
															return a.filter((w) => w !== week);
														} else {
															return [...a, week];
														}
													});
												}}
												key={week}>
												<Text
													style={{
														fontSize: 18,
														lineHeight: 40,
														color: popupWeeks.includes(week)
															? "white"
															: modalTextColor,
													}}>
													{week}
												</Text>
											</TouchableOpacity>
										))}
									</View>
									<View
										style={{
											height: 1,
											backgroundColor: theme.colors.themeGrey,
											marginTop: 14,
											marginBottom: 28,
										}}
									/>
									<View
										style={{
											flexDirection: "row",
											alignItems: "center",
											justifyContent: "center",
											marginBottom: 32,
										}}>
										<TouchableOpacity
											onPress={() =>
												setPopupWeeks(
													Array.from(
														new Array(Math.ceil(weekCount / 2)),
														(_, k) => k * 2 + 1,
													),
												)
											}
											style={{
												flexDirection: "row",
												alignItems: "center",
												justifyContent: "center",
												marginHorizontal: 16,
											}}>
											{popupIsAllOdd ? (
												<IconSelected height={16} width={16} />
											) : (
												<IconNotSelected height={16} width={16} />
											)}
											<Text
												style={{
													color: modalTextColor,
													fontSize: 14,
													marginLeft: 8,
												}}>
												{getStr("oddWeeks")}
											</Text>
										</TouchableOpacity>
										<TouchableOpacity
											onPress={() =>
												setPopupWeeks(
													Array.from(
														new Array(Math.floor(weekCount / 2)),
														(_, k) => k * 2 + 2,
													),
												)
											}
											style={{
												flexDirection: "row",
												alignItems: "center",
												justifyContent: "center",
												marginHorizontal: 16,
											}}>
											{popupIsAllEven ? (
												<IconSelected height={16} width={16} />
											) : (
												<IconNotSelected height={16} width={16} />
											)}
											<Text
												style={{
													color: modalTextColor,
													fontSize: 14,
													marginLeft: 8,
												}}>
												{getStr("evenWeeks")}
											</Text>
										</TouchableOpacity>
										<TouchableOpacity
											onPress={() =>
												setPopupWeeks(
													Array.from(
														new Array(Math.floor(weekCount)),
														(_, k) => k + 1,
													),
												)
											}
											style={{
												flexDirection: "row",
												alignItems: "center",
												justifyContent: "center",
												marginHorizontal: 16,
											}}>
											{popupIsAllWeeks ? (
												<IconSelected height={16} width={16} />
											) : (
												<IconNotSelected height={16} width={16} />
											)}
											<Text
												style={{
													color: modalTextColor,
													fontSize: 14,
													marginLeft: 8,
												}}>
												{getStr("allWeeks")}
											</Text>
										</TouchableOpacity>
										<TouchableOpacity
											onPress={() => setPopupWeeks(Array.from([]))}
											style={{
												flexDirection: "row",
												alignItems: "center",
												justifyContent: "center",
												marginHorizontal: 16,
											}}>
											{popupIsEmptyWeeks ? (
												<IconSelected height={16} width={16} />
											) : (
												<IconNotSelected height={16} width={16} />
											)}
											<Text
												style={{
													color: modalTextColor,
													fontSize: 14,
													marginLeft: 8,
												}}>
												{getStr("noWeek")}
											</Text>
										</TouchableOpacity>
									</View>
								</View>
							}
							popupCanFulfill={popupWeeks.length > 0}
							popupOnFulfilled={() => {
								setWeeks(popupWeeks);
							}}
							popupOnCancelled={() => {}}>
							<View
								style={{flexDirection: "row", alignItems: "center"}}>
									<Text
										style={{
											color: modalTextColor,
											fontSize: 16,
											flex: 0,
										}}>
									{getStr("weeks")}
								</Text>
								<View style={{flex: 1}} />
								<Text
									style={{
										color: modalTextColor,
										fontSize: 16,
										flex: 0,
									}}
									numberOfLines={1}>
									{explainWeekList(weeks)}
								</Text>
								<IconRight height={24} width={24} />
							</View>
						</BottomPopupTriggerView>
						<View
							style={{
								height: 1,
								backgroundColor: theme.colors.themeGrey,
								marginVertical: 12,
							}}
						/>
						<BottomPopupTriggerView
							popupTitle={`${getStr("dayOfWeek")[popupDay]} ${
								beginTime[popupPeriodBegin]
							} - ${endTime[popupPeriodEnd]}`}
							popupCancelable={true}
							popupContent={
								<View style={{flexDirection: "row"}}>
									<ScrollPicker
										style={{flex: 1}}
										dataSource={Array.from(
											new Array(7),
											(_, k) => getStr("dayOfWeek")[k + 1],
										)}
										selectedIndex={popupDay - 1}
										renderItem={(data) => (
											<Text
												style={{
													color: modalTextColor,
													fontSize: 20,
												}}
												key={data}>
												{data}
											</Text>
										)}
										onValueChange={(_, selectedIndex) => {
											setPopupDay(selectedIndex + 1);
										}}
										wrapperHeight={200}
										wrapperBackground={theme.colors.contentBackground}
										itemHeight={48}
										highlightColor={theme.colors.themeGrey}
										highlightBorderWidth={1}
									/>
									<ScrollPicker
										style={{flex: 1}}
										dataSource={Array.from(
											new Array(14),
											(_, k) => beginTime[k + 1],
										)}
										selectedIndex={popupPeriodBegin - 1}
										renderItem={(data) => (
											<Text
												style={{
													color: modalTextColor,
													fontSize: 20,
												}}
												key={data}>
												{data}
											</Text>
										)}
										onValueChange={(_, selectedIndex) => {
											setPopupPeriodBegin(selectedIndex + 1);
										}}
										wrapperHeight={200}
										wrapperBackground={theme.colors.contentBackground}
										itemHeight={48}
										highlightColor={theme.colors.themeGrey}
										highlightBorderWidth={1}
									/>
									<ScrollPicker
										style={{flex: 1}}
										dataSource={Array.from(
											new Array(15 - popupPeriodBegin),
											(_, k) => endTime[k + popupPeriodBegin],
										)}
										selectedIndex={popupPeriodEnd - popupPeriodBegin}
										renderItem={(data) => (
											<Text
												style={{
													color: modalTextColor,
													fontSize: 20,
												}}
												key={data}>
												{data}
											</Text>
										)}
										onValueChange={(_, selectedIndex) => {
											setPopupPeriodEnd(
												selectedIndex + popupPeriodBegin,
											);
										}}
										wrapperHeight={200}
										wrapperBackground={theme.colors.contentBackground}
										itemHeight={48}
										highlightColor={theme.colors.themeGrey}
										highlightBorderWidth={1}
									/>
								</View>
							}
							popupCanFulfill={popupPeriodBegin <= popupPeriodEnd}
							popupOnFulfilled={() => {
								setDay(popupDay);
								setPeriodBegin(popupPeriodBegin);
								setPeriodEnd(popupPeriodEnd);
							}}
							popupOnCancelled={() => {}}>
							<View
								style={{flexDirection: "row", alignItems: "center"}}>
								<Text
									style={{
										color: modalTextColor,
										fontSize: 16,
										flex: 0,
									}}>
									{getStr("periods")}
								</Text>
								<View style={{flex: 1}} />
								<Text
									style={{
										color: modalTextColor,
										fontSize: 16,
										flex: 0,
									}}
									numberOfLines={1}>
									{explainPeriod(day, periodBegin, periodEnd)}
								</Text>
								<IconRight height={24} width={24} />
							</View>
						</BottomPopupTriggerView>
					</>
				)}

				{useCustomDateTime && (
					<>
						<BottomPopupTriggerView
							popupTitle={(() => {
								if (totalDays <= 0) {
									return "";
								}
								const d = dayjs(firstDay)
									.add(popupDateIndex, "day")
									.startOf("day");
								const dow = d.day() === 0 ? 7 : d.day();
								return `${d.format("YYYY-MM-DD")} ${
									getStr("dayOfWeek")[dow]
								}`;
							})()}
							popupCancelable={true}
							popupContent={
								<View style={{flexDirection: "row"}}>
									<ScrollPicker
										style={{flex: 1}}
										dataSource={Array.from(
											new Array(totalDays),
											(_, k) => {
												const d = dayjs(firstDay)
													.add(k, "day")
													.startOf("day");
												const dow = d.day() === 0 ? 7 : d.day();
												return `${d.format("YYYY-MM-DD")} ${
													getStr("dayOfWeek")[dow]
												}`;
											},
										)}
										selectedIndex={popupDateIndex}
										renderItem={(data, index) => (
											<Text
												style={{
													color: modalTextColor,
													fontSize: 20,
												}}
												key={`${data}-${index}`}>
												{data}
											</Text>
										)}
										onValueChange={(_, selectedIndex) => {
											setPopupDateIndex(selectedIndex);
										}}
										wrapperHeight={200}
										wrapperBackground={theme.colors.contentBackground}
										itemHeight={48}
										highlightColor={theme.colors.themeGrey}
										highlightBorderWidth={1}
									/>
								</View>
							}
							popupCanFulfill={totalDays > 0}
							popupOnFulfilled={() => {
								setDateIndex(popupDateIndex);
							}}
							popupOnCancelled={() => {}}>
							<View
								style={{flexDirection: "row", alignItems: "center"}}>
								<Text
									style={{
										color: modalTextColor,
										fontSize: 16,
										flex: 0,
									}}>
									{getStr("scheduleDate" as any)}
								</Text>
								<View style={{flex: 1}} />
								<Text
									style={{
										color: modalTextColor,
										fontSize: 16,
										flex: 0,
									}}
									numberOfLines={1}>
									{totalDays > 0
										? (() => {
												const d = dayjs(firstDay)
													.add(dateIndex, "day")
													.startOf("day");
												const dow = d.day() === 0 ? 7 : d.day();
												return `${d.format("YYYY-MM-DD")} ${
													getStr("dayOfWeek")[dow]
												}`;
										  })()
										: ""}
								</Text>
								<IconRight height={24} width={24} />
							</View>
						</BottomPopupTriggerView>
						<View
							style={{
								height: 1,
								backgroundColor: theme.colors.themeGrey,
								marginVertical: 12,
							}}
						/>
						<BottomPopupTriggerView
							popupTitle={`${String(popupBeginHour).padStart(2, "0")}:${String(
								popupBeginMinute,
							).padStart(2, "0")} - ${String(
								popupEndHour,
							).padStart(2, "0")}:${String(popupEndMinute).padStart(
								2,
								"0",
							)}`}
							popupCancelable={true}
							popupContent={
								<View style={{flexDirection: "row"}}>
									<ScrollPicker
										style={{flex: 1}}
										dataSource={Array.from(
											new Array(24),
											(_, k) => String(k).padStart(2, "0"),
										)}
										selectedIndex={popupBeginHour}
										renderItem={(data, index) => (
											<Text
												style={{
													color: theme.colors.fontB1,
													fontSize: 20,
												}}
												key={`${data}-${index}`}>
												{data}
											</Text>
										)}
										onValueChange={(_, selectedIndex) => {
											setPopupBeginHour(selectedIndex);
										}}
										wrapperHeight={200}
										wrapperBackground={theme.colors.contentBackground}
										itemHeight={48}
										highlightColor={theme.colors.themeGrey}
										highlightBorderWidth={1}
									/>
									<ScrollPicker
										style={{flex: 1}}
										dataSource={Array.from(
											new Array(60),
											(_, k) => String(k).padStart(2, "0"),
										)}
										selectedIndex={popupBeginMinute}
										renderItem={(data, index) => (
											<Text
												style={{
													color: theme.colors.fontB1,
													fontSize: 20,
												}}
												key={`${data}-${index}`}>
												{data}
											</Text>
										)}
										onValueChange={(_, selectedIndex) => {
											setPopupBeginMinute(selectedIndex);
										}}
										wrapperHeight={200}
										wrapperBackground={theme.colors.contentBackground}
										itemHeight={48}
										highlightColor={theme.colors.themeGrey}
										highlightBorderWidth={1}
									/>
									<ScrollPicker
										style={{flex: 1}}
										dataSource={Array.from(
											new Array(24),
											(_, k) => String(k).padStart(2, "0"),
										)}
										selectedIndex={popupEndHour}
										renderItem={(data, index) => (
											<Text
												style={{
													color: theme.colors.fontB1,
													fontSize: 20,
												}}
												key={`${data}-${index}`}>
												{data}
											</Text>
										)}
										onValueChange={(_, selectedIndex) => {
											setPopupEndHour(selectedIndex);
										}}
										wrapperHeight={200}
										wrapperBackground={theme.colors.contentBackground}
										itemHeight={48}
										highlightColor={theme.colors.themeGrey}
										highlightBorderWidth={1}
									/>
									<ScrollPicker
										style={{flex: 1}}
										dataSource={Array.from(
											new Array(60),
											(_, k) => String(k).padStart(2, "0"),
										)}
										selectedIndex={popupEndMinute}
										renderItem={(data, index) => (
											<Text
												style={{
													color: theme.colors.fontB1,
													fontSize: 20,
												}}
												key={`${data}-${index}`}>
												{data}
											</Text>
										)}
										onValueChange={(_, selectedIndex) => {
											setPopupEndMinute(selectedIndex);
										}}
										wrapperHeight={200}
										wrapperBackground={theme.colors.contentBackground}
										itemHeight={48}
										highlightColor={theme.colors.themeGrey}
										highlightBorderWidth={1}
									/>
								</View>
							}
							popupCanFulfill={true}
							popupOnFulfilled={() => {
								setBeginHour(popupBeginHour);
								setBeginMinute(popupBeginMinute);
								setEndHour(popupEndHour);
								setEndMinute(popupEndMinute);
							}}
							popupOnCancelled={() => {}}>
							<View
								style={{flexDirection: "row", alignItems: "center"}}>
									<Text
										style={{
											color: modalTextColor,
											fontSize: 16,
											flex: 0,
										}}>
									{getStr("scheduleTimeRange" as any)}
								</Text>
								<View style={{flex: 1}} />
								<Text
									style={{
										color: theme.colors.fontB2,
										fontSize: 16,
										flex: 0,
									}}
									numberOfLines={1}>
									{`${String(beginHour).padStart(2, "0")}:${String(
										beginMinute,
									).padStart(2, "0")} - ${String(
										endHour,
									).padStart(2, "0")}:${String(endMinute).padStart(
										2,
										"0",
									)}`}
								</Text>
								<IconRight height={24} width={24} />
							</View>
						</BottomPopupTriggerView>
						<View
							style={{
								height: 1,
								backgroundColor: theme.colors.themeGrey,
								marginVertical: 12,
							}}
						/>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
							}}>
							<Text
								style={{
									color: modalTextColor,
									fontSize: 16,
									flex: 1,
								}}>
								{getStr("scheduleRepeatWeekly" as any)}
							</Text>
							<Switch
								value={repeatWeekly}
								onValueChange={setRepeatWeekly}
								trackColor={{
									false: theme.colors.themeGrey,
									true: theme.colors.themePurple,
								}}
								thumbColor={"white"}
							/>
						</View>
					</>
				)}
			</RoundedView>
			)}
						{params !== undefined && (
							<Text
								style={{
									color: modalTextColor,
									fontSize: 12,
									textAlign: "center",
									marginTop: 16,
									marginBottom: 8,
								}}>
								{getStr("scheduleLongPressHint")}
							</Text>
						)}
					</ScrollView>
				</TouchableOpacity>
			</View>
		</Modal>
	);
};
