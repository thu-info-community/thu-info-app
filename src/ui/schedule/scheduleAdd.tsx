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

interface ScheduleAddProps {
	navigation: ScheduleNav;
}

const ScheduleAddUI = ({navigation}: ScheduleAddProps) => {
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

	const [sessions, setSessions] = useState(new Array<boolean>(15).fill(false));

	const [days, setDays] = useState(
		new Array<boolean>(8).fill(false).fill(true, 1, 2),
	);

	const [subject, setSubject] = useState("");
	const [locale, setLocale] = useState("");

	const valid =
		subject.trim().length > 0 &&
		weeks.some((value) => value) &&
		days.some((value) => value) &&
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
					value={subject}
					onChangeText={setSubject}
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
								backgroundColor: days[index + 1]
									? theme.colors.accent
									: theme.colors.primaryDark,
							},
						]}
						onPress={() =>
							setDays(
								new Array<boolean>(8)
									.fill(false)
									.fill(true, index + 1, index + 2),
							)
						}>
						<Text style={style.textCenter} key={index}>
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
										backgroundColor: sessions[session]
											? theme.colors.accent
											: theme.colors.primaryDark,
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
											backgroundColor: weeks[index]
												? theme.colors.accent
												: theme.colors.primaryDark,
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
					backgroundColor: valid ? theme.colors.accent : "lightgrey",
				}}
				disabled={!valid}
				onPress={() => navigation.pop()}>
				<Text style={[style.textCenter, {fontSize: 18}]}>{getStr("done")}</Text>
			</TouchableOpacity>
		</ScrollView>
	);
};

const styles = themedStyles((theme) => {
	return {
		pressable: {
			flex: 1,
			padding: 8,
			margin: 5,
			backgroundColor: theme.colors.primaryLight,
		},
		textCenter: {
			textAlign: "center",
			color: "white",
		},
		textHeader: {
			margin: 4,
			textAlign: "center",
			fontSize: 20,
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

export const ScheduleAddScreen = connect()(ScheduleAddUI);
