import {
	ScrollView,
	View,
	Text,
	Dimensions,
	TouchableOpacity,
	RefreshControl,
} from "react-native";
import React, {ReactElement, useState, useRef, useEffect} from "react";
import {connect} from "react-redux";
import {
	activeWeek,
	Schedule,
	ScheduleType,
} from "thu-info-lib/dist/models/schedule/schedule";
import {RootNav} from "../../components/Root";
import {currState, globalObjects, helper, State} from "../../redux/store";
import {scheduleFetchAction} from "../../redux/actions/schedule";
import {ScheduleBlock} from "src/components/schedule/schedule";
import dayjs from "dayjs";
import Icon from "react-native-vector-icons/FontAwesome";
import ViewShot from "react-native-view-shot";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import md5 from "md5";

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

interface ScheduleProps {
	readonly baseSchedule: Schedule[];
	readonly cache: string;
	readonly refreshing: boolean;
	readonly shortenMap: {[key: string]: string | undefined};
	getSchedule: () => void;
	navigation: RootNav;
}

const ScheduleUI = (props: ScheduleProps) => {
	const {firstDay, weekCount} = currState().config;
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

	const viewShot = useRef<ViewShot>(null);

	globalObjects.scheduleViewShot = viewShot;

	const themeName = useColorScheme();
	const theme = themes(themeName);

	const timeBlockNum = 14;
	const daysInWeek = 7;
	const borderTotWidth = daysInWeek + 1;

	const unitHeight = 65;
	const unitWidth =
		(Dimensions.get("window").width - borderTotWidth) / (daysInWeek + 1 / 2);

	const colorList: string[] = [
		"#16A085",
		"#27AE60",
		"#2980B9",
		"#8E44AD",
		"#2C3E50",
		"#F39C12",
		"#D35400",
		"#C0392B",
		"#BDC3C7",
		"#7F8C8D",
	];

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(props.getSchedule, []);

	useEffect(() => {
		if (currState().config.semesterId !== props.cache) {
			console.log(
				"Schedule: Corresponding cache not found. Auto fetch from server.",
			);
			props.getSchedule();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.cache]);

	const horizontalLine = () => (
		<View style={{backgroundColor: "lightgray", height: 1}} />
	);

	const basicGrid = () => {
		let daysOfWeekList: ReactElement[] = [];

		for (let ind = 1; ind <= 7; ++ind) {
			daysOfWeekList.push(
				<View
					style={{
						flex: 2,
						borderLeftColor: "lightgray",
						borderLeftWidth: ind === 1 ? 2 : 1,
						alignContent: "center",
						justifyContent: "center",
						backgroundColor: theme.colors.themeBackground,
					}}
					key={`0-${ind + 1}`}>
					<Text style={{textAlign: "center", color: "gray"}}>
						{`${firstDay
							.add((week - 1) * 7 + ind - 1, "day")
							.format("MM.DD")}\n${getStr("dayOfWeek")[ind]}`}
					</Text>
				</View>,
			);
		}

		let gridHead = (
			<View
				style={{
					flexDirection: "row",
					borderBottomColor: "lightgray",
					borderBottomWidth: 2,
					height: unitHeight / 2,
					backgroundColor: theme.colors.themeBackground,
				}}
				key="0">
				<View
					style={{flex: 1, backgroundColor: theme.colors.themeBackground}}
					key="0-0"
				/>
				{daysOfWeekList}
			</View>
		);

		let basicRow = (ind: number) => {
			let blockList = [];
			blockList.push(
				<View
					style={{
						flex: 1,
						alignContent: "center",
						justifyContent: "center",
						backgroundColor: theme.colors.themeBackground,
					}}
					key={`${ind}-0`}>
					<Text style={{textAlign: "center", color: "gray"}}>{ind}</Text>
				</View>,
			);
			for (let i = 0; i < daysInWeek; ++i) {
				blockList.push(
					<View
						style={{
							flex: 2,
							borderLeftColor: "lightgray",
							borderLeftWidth: i ? 1 : 2,
							backgroundColor:
								week === nowWeek && i + 1 === today
									? theme.colors.contentBackground === "#000000"
										? "#3D3D3D"
										: "#F4F4F4"
									: theme.colors.contentBackground,
						}}
						key={`${ind}-${i + 1}`}
					/>,
				);
			}
			return blockList;
		};

		let rowList: ReactElement[] = [gridHead];
		for (let i = 1; i <= timeBlockNum; ++i) {
			rowList.push(
				<View
					style={{
						flex: 2,
						flexDirection: "row",
						height: unitHeight,
						borderBottomColor: "lightgray",
						borderBottomWidth: [2, 5, 7, 9, 11].indexOf(i) === -1 ? 1 : 2,
						backgroundColor: "white",
					}}
					key={`${i}`}>
					{basicRow(i)}
				</View>,
			);
		}

		return <View style={{flex: 1, backgroundColor: "white"}}>{rowList}</View>;
	};

	const allSchedule = () => {
		let components: ReactElement[] = [];
		props.baseSchedule
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
									name={(props.shortenMap[val.name] ?? val.name).substring(
										val.type === ScheduleType.CUSTOM ? 6 : 0,
									)}
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
										props.navigation.navigate("ScheduleDetail", {
											name: val.name,
											location: val.location,
											week: week,
											dayOfWeek: slice.dayOfWeek,
											begin: slice.begin,
											end: slice.end,
											alias: props.shortenMap[val.name] ?? "",
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
								name={(props.shortenMap[val.name] ?? val.name).substring(
									val.type === ScheduleType.CUSTOM ? 6 : 0,
								)}
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
									props.navigation.navigate("ScheduleDetail", {
										name: val.name,
										location: val.location,
										week: week,
										dayOfWeek: slice.dayOfWeek,
										begin: slice.begin,
										end: slice.end,
										alias: props.shortenMap[val.name] ?? "",
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

	const todayMark = () =>
		week === nowWeek ? (
			<View
				style={{
					position: "absolute",
					left: ((today * 2 - 1) * unitWidth) / 2 + today + 2,
					top: 2,
					width: unitWidth - 2,
					height: unitHeight / 2 - 4,
					backgroundColor: "gray",
					borderRadius: 5,
					alignContent: "center",
					justifyContent: "center",
				}}>
				<Text style={{color: "white", textAlign: "center"}}>
					{`${firstDay
						.add((week - 1) * 7 + today - 1, "day")
						.format("MM.DD")}\n${getStr("dayOfWeek")[today]}`}
				</Text>
			</View>
		) : null;

	return (
		<>
			<View
				style={{
					padding: 10,
					justifyContent: "space-between",
					alignItems: "center",
					flexDirection: "row",
				}}>
				<TouchableOpacity
					onPress={() => setWeek((o) => (o > 1 ? o - 1 : o))}
					disabled={week <= 1}
					style={{padding: 8}}>
					<Icon
						name="chevron-left"
						size={24}
						color={week > 1 ? theme.colors.text : "#888"}
					/>
				</TouchableOpacity>
				<Text
					onPress={() => setWeek(nowWeek)}
					style={{
						fontSize: 18,
						textAlign: "center",
						flex: 1,
						color: theme.colors.text,
					}}>
					{week}
				</Text>
				<TouchableOpacity
					onPress={() => setWeek((o) => (week < weekCount ? o + 1 : o))}
					disabled={week >= weekCount}
					style={{padding: 8}}>
					<Icon
						name="chevron-right"
						size={24}
						color={week < weekCount ? theme.colors.text : "#888"}
					/>
				</TouchableOpacity>
			</View>
			<ScrollView
				style={{flex: 1, flexDirection: "column"}}
				refreshControl={
					<RefreshControl
						refreshing={props.refreshing}
						onRefresh={props.getSchedule}
						colors={[theme.colors.accent]}
					/>
				}>
				<ViewShot ref={viewShot}>
					{horizontalLine()}
					{basicGrid()}
					{allSchedule()}
					{todayMark()}
				</ViewShot>
			</ScrollView>
		</>
	);
};

export const ScheduleScreen = connect(
	(state: State) => ({
		...state.schedule,
	}),
	(dispatch) => ({
		getSchedule: () => {
			dispatch(scheduleFetchAction.request());
			helper
				.getSchedule()
				.then((res) =>
					dispatch(
						scheduleFetchAction.success({
							schedule: res,
							semesterId: currState().config.semesterId,
						}),
					),
				)
				.catch(() => dispatch(scheduleFetchAction.failure()));
		},
	}),
)(ScheduleUI);
