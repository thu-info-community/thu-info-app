import React, {useLayoutEffect, useState} from "react";
import {
	Alert,
	Dimensions,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import {connect} from "react-redux";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {RootNav, ScheduleAddRouteProp} from "../../components/Root";
import {
	getOverlappedBlock,
	Schedule,
	scheduleTimeAdd,
	ScheduleType,
	TimeSlice,
} from "thu-info-lib/dist/models/schedule/schedule";
import {
	scheduleAddCustomAction,
	scheduleDelOrHideAction,
	scheduleUpdateAliasAction,
	scheduleUpdateLocationAction,
} from "../../redux/actions/schedule";
import {currState, State, store} from "../../redux/store";
import {Choice} from "src/redux/reducers/schedule";
import {useColorScheme} from "react-native";
import {BottomPopupTriggerView, RoundedView} from "../../components/views";
import IconRight from "../../assets/icons/IconRight";
import {explainPeriod, explainWeekList} from "../../utils/calendar";
import IconSelected from "../../assets/icons/IconSelected";
import IconNotSelected from "../../assets/icons/IconNotSelected";
import ScrollPicker from "react-native-wheel-scrollview-picker";

interface ScheduleAddProps {
	scheduleList: Schedule[];
	customCnt: number;
	navigation: RootNav;
	route: ScheduleAddRouteProp;
	addCustom: (payload: Schedule) => void;
	delOrHide: (title: string, block: TimeSlice, choice: Choice) => void;
}

export const numberToCode = (num: number): string => {
	const pow10: number[] = [100000, 10000, 1000, 100, 10, 1];
	let res: string = "";
	pow10.forEach((val) => {
		res += Math.floor(num / val) % 10;
	});
	return res;
};

const ScheduleAddUI = ({
	scheduleList,
	customCnt,
	navigation,
	addCustom,
	delOrHide,
	route: {params},
}: ScheduleAddProps) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);

	const weekCount = currState().config.weekCount;

	const [weeks, setWeeks] = useState(
		Array.from(new Array(weekCount), (_, k) => k + 1),
	);

	const [popupWeeks, setPopupWeeks] = useState<number[]>(
		Array.from(new Array(weekCount), (_, k) => k + 1),
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

	const [day, setDay] = useState(1);
	const [popupDay, setPopupDay] = useState(1);

	const [periodBegin, setPeriodBegin] = useState(1);
	const [periodEnd, setPeriodEnd] = useState(14);

	const [popupPeriodBegin, setPopupPeriodBegin] = useState(1);
	const [popupPeriodEnd, setPopupPeriodEnd] = useState(14);

	const [title, setTitle] = useState(params?.alias ?? "");
	const [locale, setLocale] = useState(params?.location ?? "");

	const valid = title.trim().length > 0 && weeks.length > 0;

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
								store.dispatch(
									scheduleUpdateAliasAction([params.name, undefined]),
								);
							} else {
								const res: string =
									(params.type === ScheduleType.CUSTOM
										? params.name.substring(0, 6)
										: "") + title;
								store.dispatch(scheduleUpdateAliasAction([params.name, res]));
							}
							store.dispatch(
								scheduleUpdateLocationAction([params.name, locale]),
							);
							// TODO: 要允许修改计划的时间
							navigation.pop();
							return;
						}

						// TODO: 需要禁止添加和已有计划重名的计划
						let newSchedule: Schedule = {
							name: numberToCode(customCnt) + title,
							location: locale,
							activeTime: {base: []},
							delOrHideTime: {base: []},
							type: ScheduleType.CUSTOM,
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
												delOrHide(val[0], val[2], Choice.ONCE);
											});
											addCustom(newSchedule);
											navigation.pop();
										},
									},
									{
										text: getStr("cancel"),
									},
								],
							);
						} else {
							addCustom(newSchedule);
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
	}, [navigation, valid, params, title, locale, weeks, periodBegin, periodEnd]);

	return (
		<ScrollView style={{padding: 12}}>
			<RoundedView style={{marginTop: 4, padding: 16}}>
				<TextInput
					style={{
						color: theme.colors.text,
						padding: 0,
						fontSize: 16,
					}}
					placeholder={params?.name ?? getStr("title")}
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
					value={locale}
					onChangeText={setLocale}
				/>
			</RoundedView>
			<RoundedView style={{marginTop: 16, padding: 16}}>
				<BottomPopupTriggerView
					disabled={params !== undefined}
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
										marginHorizontal: 32,
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
							style={{color: theme.colors.fontB3, fontSize: 16, flex: 0}}
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
					disabled={params !== undefined}
					popupTitle={explainPeriod(popupDay, popupPeriodBegin, popupPeriodEnd)}
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
								wrapperColor={theme.colors.contentBackground}
								itemHeight={48}
								highlightColor={theme.colors.themeGrey}
								highlightBorderWidth={1}
							/>
							<ScrollPicker
								style={{flex: 1}}
								dataSource={Array.from(
									new Array(14),
									(_, k) =>
										getStr("periodNumPrefix") +
										(k + 1) +
										getStr("periodNumSuffix"),
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
								wrapperColor={theme.colors.contentBackground}
								itemHeight={48}
								highlightColor={theme.colors.themeGrey}
								highlightBorderWidth={1}
							/>
							<ScrollPicker
								style={{flex: 1}}
								dataSource={Array.from(
									new Array(15 - popupPeriodBegin),
									(_, k) =>
										getStr("till") +
										getStr("periodNumPrefix") +
										(k + popupPeriodBegin) +
										getStr("periodNumSuffix"),
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
								wrapperColor={theme.colors.contentBackground}
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
							style={{color: theme.colors.fontB3, fontSize: 16, flex: 0}}
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

export const ScheduleAddScreen = connect(
	(state: State) => ({
		scheduleList: state.schedule.baseSchedule,
		customCnt: state.schedule.customCnt,
	}),
	(dispatch) => ({
		addCustom: (payload: Schedule) =>
			dispatch(scheduleAddCustomAction(payload)),
		delOrHide: (title: string, block: TimeSlice, choice: Choice) => {
			dispatch(scheduleDelOrHideAction([title, block, choice]));
		},
	}),
)(ScheduleAddUI);
