import React, {useState} from "react";
import {
	Alert,
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import {connect} from "react-redux";
import themes from "../../assets/themes/themes";
import themedStyles from "../../utils/themedStyles";
import {getStr} from "../../utils/i18n";
import {RootNav} from "../../components/Root";
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
} from "../../redux/actions/schedule";
import {currState, State} from "../../redux/store";
import {Choice} from "src/redux/reducers/schedule";
import {useColorScheme} from "react-native";

interface ScheduleAddProps {
	scheduleList: Schedule[];
	customCnt: number;
	navigation: RootNav;
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
}: ScheduleAddProps) => {
	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

	const NA = 0;

	const sessionGroups = [
		[1, 2, NA],
		[3, 4, 5],
		[6, 7, NA],
		[8, 9, NA],
		[10, 11, NA],
		[12, 13, 14],
	];

	const weekCount = currState().config.weekCount;

	const [weeks, setWeeks] = useState(
		new Array<boolean>(weekCount + 1).fill(false),
	);

	const [sessions, setSessions] = useState(new Array<boolean>(16).fill(false));

	const [day, setDay] = useState(1);

	const [title, setTitle] = useState("");
	const [locale, setLocale] = useState("");

	const valid =
		title.trim().length > 0 &&
		weeks.some((value) => value) &&
		sessions.some((value) => value);

	const updateWeeks = (transform: (original: boolean[]) => void) => () => {
		setWeeks((src) => {
			const original = Array.from(src);
			transform(original);
			return original;
		});
	};

	return (
		<ScrollView style={{padding: 5}}>
			<Text style={style.textHeader}>{getStr("basicInfo")}</Text>
			<View style={{flexDirection: "row"}}>
				<TextInput
					style={style.textInputStyle}
					placeholder={getStr("subject")}
					value={title}
					onChangeText={setTitle}
				/>
				<TextInput
					style={style.textInputStyle}
					placeholder={getStr("localeOptional")}
					value={locale}
					onChangeText={setLocale}
				/>
			</View>
			<Text style={style.textHeader}>{getStr("selectDayOfWeek")}</Text>
			<View style={{flexDirection: "row"}}>
				{Array.from(new Array(7), (_, index) => (
					<TouchableOpacity
						key={index}
						style={[
							style.pressable,
							{
								borderColor:
									index + 1 === day ? theme.colors.accent : "lightgray",
								shadowColor: index + 1 === day ? theme.colors.accent : "gray",
							},
						]}
						onPress={() => setDay(index + 1)}>
						<Text style={style.dayOfWeekCenter} key={index}>
							{getStr("dayOfWeek")[index + 1]}
						</Text>
					</TouchableOpacity>
				))}
			</View>
			<Text style={style.textHeader}>{getStr("selectSession")}</Text>
			<View style={{flexDirection: "row"}}>
				{sessionGroups.map((sessionGroup, index) => (
					<View key={index} style={{flex: 1}}>
						{sessionGroup.map((session) => (
							<TouchableOpacity
								key={session}
								style={[
									style.pressable,
									{
										borderColor: sessions[session]
											? theme.colors.accent
											: "lightgray",
										shadowColor: sessions[session]
											? theme.colors.accent
											: "gray",
									},
								]}
								onPress={() => {
									if (session !== NA) {
										setSessions((src) => {
											const result = Array.from(src);
											result[session] = !result[session];
											return result;
										});
									}
								}}>
								<Text style={style.textCenter}>
									{session !== NA && session}
								</Text>
							</TouchableOpacity>
						))}
					</View>
				))}
			</View>
			<Text style={style.textHeader}>{getStr("selectWeek")}</Text>
			<View>
				{Array.from(new Array(weekCount / 6), (_, i) => (
					<View key={i} style={{flexDirection: "row"}}>
						{Array.from(new Array(6), (__, j) => {
							const index = i * 6 + j + 1;
							return (
								<TouchableOpacity
									key={j}
									style={[
										style.pressable,
										{
											borderColor: weeks[index]
												? theme.colors.accent
												: "lightgray",
											shadowColor: weeks[index] ? theme.colors.accent : "gray",
										},
									]}
									onPress={updateWeeks(
										(original) => (original[index] = !original[index]),
									)}>
									<Text style={style.textCenter}>{index}</Text>
								</TouchableOpacity>
							);
						})}
					</View>
				))}
				<View style={{flexDirection: "row"}}>
					<TouchableOpacity
						style={style.pressable}
						onPress={updateWeeks((original) => {
							for (let i = 1; i <= weekCount; i += 2) {
								original[i] = true;
							}
						})}>
						<Text style={style.textCenter}>{getStr("chooseOdd")}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={style.pressable}
						onPress={updateWeeks((original) => {
							for (let i = 1; i <= weekCount; i += 2) {
								original[i] = false;
							}
						})}>
						<Text style={style.textCenter}>{getStr("notOdd")}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={style.pressable}
						onPress={updateWeeks((original) => {
							for (let i = 2; i <= weekCount; i += 2) {
								original[i] = true;
							}
						})}>
						<Text style={style.textCenter}>{getStr("chooseEven")}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={style.pressable}
						onPress={updateWeeks((original) => {
							for (let i = 2; i <= weekCount; i += 2) {
								original[i] = false;
							}
						})}>
						<Text style={style.textCenter}>{getStr("notEven")}</Text>
					</TouchableOpacity>
				</View>
			</View>
			<TouchableOpacity
				style={{
					padding: 10,
					margin: 5,
					marginTop: 20,
					borderRadius: 4,
					shadowColor: "grey",
					shadowOffset: {
						width: 1,
						height: 1,
					},
					shadowOpacity: 0.8,
					shadowRadius: 2,
					backgroundColor: valid ? theme.colors.accent : "lightgrey",
				}}
				disabled={!valid}
				onPress={() => {
					// TODO: 需要禁止添加和已有计划重名的计划
					const heads = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].filter(
						(i) => sessions[i] && !sessions[i - 1],
					);
					const tails = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].filter(
						(i) => sessions[i] && !sessions[i + 1],
					);
					const ranges = Array.from(heads, (v, k) => [v, tails[k]]);
					const selectedWeeks = Array.from(
						new Array(weekCount),
						(_, index) => index + 1,
					).filter((week) => weeks[week]);
					let newSchedule: Schedule = {
						name: numberToCode(customCnt) + title,
						location: locale,
						activeTime: {base: []},
						delOrHideTime: {base: []},
						type: ScheduleType.CUSTOM,
					};

					// TODO: 删除第二层回调
					ranges.flatMap((range) =>
						selectedWeeks.map((week) => {
							scheduleTimeAdd(newSchedule.activeTime, {
								dayOfWeek: day,
								begin: range[0],
								end: range[1],
								activeWeeks: [week],
							});
						}),
					);

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
											val[0].substr(val[1] === ScheduleType.CUSTOM ? 6 : 0) +
											"」\n" +
											getStr("weekNumPrefix") +
											val[2].activeWeeks[0] +
											getStr("weekNumSuffix") +
											" " +
											getStr("dayOfWeek")[val[2].dayOfWeek] +
											" " +
											getStr("periodNumPrefix") +
											val[2].begin +
											(val[2].begin === val[2].end ? "" : " ~ " + val[2].end) +
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
					style={[
						style.textCenter,
						{
							fontSize: 16,
							fontWeight: "bold",
							color: valid ? "white" : "black",
						},
					]}>
					{getStr("done")}
				</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = themedStyles(({colors}) => {
	return {
		pressable: {
			flex: 1,
			padding: 6,
			margin: 5,
			backgroundColor: colors.themeBackground,
			justifyContent: "center",
			borderRadius: 3,
			shadowColor: "grey",
			shadowOffset: {
				width: 1,
				height: 1,
			},
			shadowOpacity: 0.8,
			shadowRadius: 2,
			borderColor: "lightgray",
			borderWidth: 2.5,
		},

		dayOfWeekCenter: {
			textAlign: "center",
			fontSize: 12,
			color: colors.text,
		},

		textCenter: {
			textAlign: "center",
			fontSize: 14,
			color: colors.text,
		},

		textHeader: {
			margin: 4,
			textAlign: "center",
			fontSize: 18,
			marginTop: 20,
			marginBottom: 10,
			color: colors.text,
		},

		textInputStyle: {
			height: 38,
			flex: 1,
			backgroundColor: colors.themeBackground,
			color: colors.text,
			textAlign: "left",
			borderColor: "lightgrey",
			borderWidth: 1,
			borderRadius: 5,
			padding: 10,
			marginHorizontal: 5,
		},
	};
});

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
