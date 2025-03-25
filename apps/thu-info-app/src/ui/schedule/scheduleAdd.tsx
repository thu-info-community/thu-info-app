import {useLayoutEffect, useState} from "react";
import {
	Alert,
	Dimensions,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import {useDispatch, useSelector} from "react-redux";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {RootNav, ScheduleAddRouteProp} from "../../components/Root";
import {
	getOverlappedBlock,
	Schedule,
	scheduleTimeAdd,
	ScheduleType,
	TimeSlice,
} from "@thu-info/lib/src/models/schedule/schedule";
import {State} from "../../redux/store";
import {
	Choice,
	scheduleAddCustom,
	scheduleDelOrHide,
	scheduleUpdateAlias,
	scheduleUpdateLocation,
} from "../../redux/slices/schedule";
import {useColorScheme} from "react-native";
import {BottomPopupTriggerView, RoundedView} from "../../components/views";
import IconRight from "../../assets/icons/IconRight";
import {explainPeriod, explainWeekList} from "../../utils/calendar";
import IconSelected from "../../assets/icons/IconSelected";
import IconNotSelected from "../../assets/icons/IconNotSelected";
import ScrollPicker from "react-native-wheel-scrollview-picker";
import {beginTime, endTime} from "./scheduleDetail";

export const numberToCode = (num: number): string => {
	const pow10: number[] = [100000, 10000, 1000, 100, 10, 1];
	let res: string = "";
	pow10.forEach((val) => {
		res += Math.floor(num / val) % 10;
	});
	return res;
};

export const ScheduleAddScreen = ({
	navigation,
	route: {params},
}: {
	navigation: RootNav;
	route: ScheduleAddRouteProp;
}) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	const scheduleList = useSelector((s: State) => s.schedule.baseSchedule);
	const customCnt = useSelector((s: State) => s.schedule.customCnt);

	const weekCount = useSelector((s: State) => s.config.weekCount);

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

	const [day, setDay] = useState(params?.dayOfWeek ?? 1);
	const [popupDay, setPopupDay] = useState(params?.dayOfWeek ?? 1);

	const [periodBegin, setPeriodBegin] = useState(params ? Number(params.begin) : 1);
	const [periodEnd, setPeriodEnd] = useState(params ? Number(params?.end) : 14);

	const [popupPeriodBegin, setPopupPeriodBegin] = useState(params ? Number(params?.begin) : 1);
	const [popupPeriodEnd, setPopupPeriodEnd] = useState(params ? Number(params?.end) : 14);

	const [title, setTitle] = useState(params?.alias ?? "");
	const [locale, setLocale] = useState(params?.location ?? "");

	// Prepare for modify custom schedule's time
	// const timeEditable = (params && params?.type !== ScheduleType.CUSTOM) || false;
	const timeEditable = params !== undefined;

	const valid =
		(title.trim().length > 0 || params !== undefined) && weeks.length > 0;

	const windowWidth = Dimensions.get("window").width;
	const weekButtonWidth = (windowWidth - 24) / 4 - 6 - 1;

	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<TouchableOpacity
					style={{paddingHorizontal: 16, margin: 4}}
					disabled={!valid}
					onPress={() => {
						if (params !== undefined) {
							// 代表是在修改现有计划
							if (title.length === 0) {
								dispatch(scheduleUpdateAlias([params.name, undefined]));
							} else {
								dispatch(scheduleUpdateAlias([params.name, title]));
							}
							dispatch(scheduleUpdateLocation([params.name, locale]));

							if (
								// 时间没有变化
								day === params.dayOfWeek &&
								periodBegin === Number(params.begin) &&
								periodEnd === Number(params.end) &&
								weeks.length === params.activeWeeks?.length &&
								weeks.every(
									(val, idx) =>
										params.activeWeeks && val === params.activeWeeks[idx],
								)
							) {
								navigation.pop(2);
								return;
							}
							// TODO: Modify custom schedule's time
							// dispatch(scheduleDelOrHide([params.name, {
							// 	dayOfWeek: params.dayOfWeek,
							// 	begin: Number(params.begin),
							// 	end: Number(params.end),
							// 	activeWeeks: params.activeWeeks || [],
							// }, Choice.ALL]));
						}

						// TODO: 需要禁止添加和已有计划重名的计划
						let newSchedule: Schedule = {
							name: numberToCode(customCnt) + (title || params?.name.substring(6) || ""),
							location: locale,
							activeTime: {base: []},
							delOrHideTime: {base: []},
							type: ScheduleType.CUSTOM,
							hash: "",
						};

						weeks.forEach((week) => {
							scheduleTimeAdd(newSchedule.activeTime, {
								dayOfWeek: day,
								begin: periodBegin,
								end: periodEnd,
								activeWeeks: [week],
							});
						});

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
												val[0].substring(
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
											navigation.pop();
										},
									},
									{
										text: getStr("cancel"),
									},
								],
							);
						} else {
							dispatch(scheduleAddCustom(newSchedule));
							navigation.pop();
						}
					}}>
					<Text
						style={{
							color: valid ? theme.colors.themePurple : theme.colors.themeGrey,
							fontSize: 16,
						}}>
						{getStr("save")}
					</Text>
				</TouchableOpacity>
			),
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		navigation,
		valid,
		params,
		customCnt,
		title,
		locale,
		weeks,
		day,
		periodBegin,
		periodEnd,
		dispatch,
		scheduleList,
	]);

	return (
		<ScrollView style={{padding: 12}}>
			<RoundedView style={{marginTop: 4, padding: 16}}>
				<TextInput
					style={{
						color: theme.colors.text,
						padding: 0,
						fontSize: 16,
					}}
					placeholder={
						params?.name?.substring(
							params?.type === ScheduleType.CUSTOM ? 6 : 0,
						) ?? getStr("title")
					}
					placeholderTextColor={theme.colors.fontB3}
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
						color: theme.colors.text,
						padding: 0,
						fontSize: 16,
					}}
					placeholder={getStr("location")}
					placeholderTextColor={theme.colors.fontB3}
					value={locale}
					onChangeText={setLocale}
				/>
			</RoundedView>
			<RoundedView style={{marginTop: 16, padding: 16}}>
				<BottomPopupTriggerView
					disabled={timeEditable}
					popupTitle={explainWeekList(popupWeeks)}
					popupContent={
						<View>
							<View
								style={{
									marginHorizontal: 12,
									marginTop: 7,
									flexDirection: "row",
									flexWrap: "wrap",
								}}>
								{Array.from(new Array(weekCount), (_, k) => k + 1).map(
									(week) => (
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
														: theme.colors.fontB1,
												}}>
												{week}
											</Text>
										</TouchableOpacity>
									),
								)}
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
											color: theme.colors.fontB1,
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
											color: theme.colors.fontB1,
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
											color: theme.colors.fontB1,
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
											color: theme.colors.fontB1,
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
					<View style={{flexDirection: "row", alignItems: "center"}}>
						<Text style={{color: theme.colors.fontB1, fontSize: 16, flex: 0}}>
							{getStr("weeks")}
						</Text>
						<View style={{flex: 1}} />
						<Text
							style={{
								color: timeEditable ? theme.colors.fontB3 : theme.colors.fontB2,
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
					disabled={timeEditable}
					popupTitle={`${getStr("dayOfWeek")[popupDay]} ${
						beginTime[popupPeriodBegin]
					} - ${endTime[popupPeriodEnd]}`}
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
										style={{color: theme.colors.fontB1, fontSize: 20}}
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
										style={{color: theme.colors.fontB1, fontSize: 20}}
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
										style={{color: theme.colors.fontB1, fontSize: 20}}
										key={data}>
										{data}
									</Text>
								)}
								onValueChange={(_, selectedIndex) => {
									setPopupPeriodEnd(selectedIndex + popupPeriodBegin);
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
					<View style={{flexDirection: "row", alignItems: "center"}}>
						<Text style={{color: theme.colors.fontB1, fontSize: 16, flex: 0}}>
							{getStr("periods")}
						</Text>
						<View style={{flex: 1}} />
						<Text
							style={{
								color: timeEditable ? theme.colors.fontB3 : theme.colors.fontB2,
								fontSize: 16,
								flex: 0,
							}}
							numberOfLines={1}>
							{explainPeriod(day, periodBegin, periodEnd)}
						</Text>
						<IconRight height={24} width={24} />
					</View>
				</BottomPopupTriggerView>
			</RoundedView>
		</ScrollView>
	);
};
