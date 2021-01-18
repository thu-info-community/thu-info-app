import React, {useContext, useState} from "react";
import {
	ScrollView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import {connect} from "react-redux";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";
import {Calendar} from "../../utils/calendar";
import themedStyles from "../../utils/themedStyles";
import {getStr} from "../../utils/i18n";
import {ScheduleNav} from "./scheduleStack";
import {
	addActiveTimeBlocks,
	Schedule,
	ScheduleType,
} from "../../models/schedule/schedule";
import {SCHEDULE_ADD_CUSTOM} from "../../redux/constants";

interface ScheduleAddProps {
	navigation: ScheduleNav;
	addCustom: (payload: Schedule) => void;
}

const ScheduleAddUI = ({navigation, addCustom}: ScheduleAddProps) => {
	const themeName = useContext(ThemeContext);
	const theme = themes[themeName];
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

	const [weeks, setWeeks] = useState(
		new Array<boolean>(Calendar.weekCount + 1).fill(false),
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
				{Array.from(new Array(Calendar.weekCount / 6), (_, i) => (
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
							for (let i = 1; i <= Calendar.weekCount; i += 2) {
								original[i] = true;
							}
						})}>
						<Text style={style.textCenter}>{getStr("chooseOdd")}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={style.pressable}
						onPress={updateWeeks((original) => {
							for (let i = 1; i <= Calendar.weekCount; i += 2) {
								original[i] = false;
							}
						})}>
						<Text style={style.textCenter}>{getStr("notOdd")}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={style.pressable}
						onPress={updateWeeks((original) => {
							for (let i = 2; i <= Calendar.weekCount; i += 2) {
								original[i] = true;
							}
						})}>
						<Text style={style.textCenter}>{getStr("chooseEven")}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						style={style.pressable}
						onPress={updateWeeks((original) => {
							for (let i = 2; i <= Calendar.weekCount; i += 2) {
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
					const heads = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].filter(
						(i) => sessions[i] && !sessions[i - 1],
					);
					const tails = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].filter(
						(i) => sessions[i] && !sessions[i + 1],
					);
					const ranges = Array.from(heads, (v, k) => [v, tails[k]]);
					const selectedWeeks = Array.from(
						new Array(Calendar.weekCount),
						(_, index) => index + 1,
					).filter((week) => weeks[week]);
					let newSchedule = {
						name: title,
						location: locale,
						activeTime: [],
						delOrHideTime: [],
						type: ScheduleType.CUSTOM,
					};
					ranges.flatMap((range) =>
						selectedWeeks.map((week) => {
							addActiveTimeBlocks(week, day, range[0], range[1], newSchedule);
						}),
					);
					addCustom(newSchedule);
					navigation.pop();
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

const styles = themedStyles(() => {
	// TODO: themed styles
	return {
		pressable: {
			flex: 1,
			padding: 8,
			margin: 5,
			backgroundColor: "white",
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
		},

		textCenter: {
			textAlign: "center",
			fontSize: 14,
		},

		textHeader: {
			margin: 4,
			textAlign: "center",
			fontSize: 18,
			marginTop: 20,
			marginBottom: 10,
		},

		textInputStyle: {
			height: 38,
			flex: 1,
			backgroundColor: "white",
			textAlign: "left",
			borderColor: "lightgrey",
			borderWidth: 1,
			borderRadius: 5,
			padding: 10,
			marginHorizontal: 5,
		},
	};
});

export const ScheduleAddScreen = connect(undefined, (dispatch) => {
	return {
		addCustom: (payload: Schedule) =>
			dispatch({type: SCHEDULE_ADD_CUSTOM, payload}),
	};
})(ScheduleAddUI);
