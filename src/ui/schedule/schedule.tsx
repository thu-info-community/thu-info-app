import {
	ScrollView,
	View,
	Text,
	Dimensions,
	TouchableOpacity,
	RefreshControl,
} from "react-native";
import React, {
	ReactElement,
	useState,
	useContext,
	useRef,
	useEffect,
} from "react";
import {connect} from "react-redux";
import {
	activeWeek,
	Schedule,
	ScheduleType,
} from "../../models/schedule/schedule";
import {ScheduleNav} from "./scheduleStack";
import {State} from "../../redux/store";
import {scheduleThunk} from "../../redux/actions/schedule";
import {ScheduleBlock} from "src/components/schedule/schedule";
import {Calendar} from "../../utils/calendar";
import Icon from "react-native-vector-icons/FontAwesome";
import ViewShot from "react-native-view-shot";
import {saveImg} from "../../utils/saveImg";
import {getStr} from "../../utils/i18n";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";

interface ScheduleProps {
	readonly baseSchedule: Schedule[];
	readonly cache: string;
	readonly refreshing: boolean;
	readonly shortenMap: {[key: string]: string};
	readonly unitHeight: number;
	getSchedule: () => void;
	navigation: ScheduleNav;
}

const OptionButton = ({
	onPress,
	title,
}: {
	onPress: () => void;
	title: React.ReactText;
}) => {
	const themeName = useContext(ThemeContext);
	const theme = themes[themeName];
	return (
		<TouchableOpacity
			onPress={onPress}
			style={{
				flex: 1,
				backgroundColor: theme.colors.accent,
				padding: 8,
				margin: 2,
				borderRadius: 5,
				justifyContent: "center",
			}}>
			<Text style={{textAlign: "center", color: "white"}}>{title}</Text>
		</TouchableOpacity>
	);
};

const ScheduleUI = (props: ScheduleProps) => {
	const [week, setWeek] = useState(new Calendar().weekNumber);
	const viewShot = useRef<ViewShot>(null);

	const themeName = useContext(ThemeContext);
	const theme = themes[themeName];

	const timeBlockNum = 14;
	const daysInWeek = 7;
	const borderTotWidth = daysInWeek + 1;

	// TODO: let it able to be modified
	const unitHeight = props.unitHeight;
	const unitWidth =
		(Dimensions.get("window").width - borderTotWidth) / (daysInWeek + 1 / 2);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(props.getSchedule, []);

	useEffect(() => {
		if (Calendar.semesterId !== props.cache) {
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
		["周一", "周二", "周三", "周四", "周五", "周六", "周日"].forEach(
			(val, ind) => {
				daysOfWeekList.push(
					<View
						style={{
							flex: 2,
							borderLeftColor: "lightgray",
							borderLeftWidth: ind ? 1 : 2,
							alignContent: "center",
							justifyContent: "center",
							backgroundColor: "white",
						}}
						key={`0-${ind + 1}`}>
						<Text style={{textAlign: "center", color: "gray"}}>{val}</Text>
					</View>,
				);
			},
		);

		let gridHead = (
			<View
				style={{
					flexDirection: "row",
					borderBottomColor: "lightgray",
					borderBottomWidth: 2,
					height: unitHeight / 2,
					backgroundColor: "white",
				}}
				key="0">
				<View style={{flex: 1, backgroundColor: "white"}} key="0-0" />
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
						backgroundColor: "white",
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
							backgroundColor: "white",
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
			.filter((val) => activeWeek(week, val))
			.forEach((val) => {
				val.activeTime.forEach((block) => {
					if (block.week === week) {
						components.push(
							<ScheduleBlock
								dayOfWeek={block.dayOfWeek}
								begin={block.begin}
								end={block.end}
								name={
									val.type === ScheduleType.CUSTOM
										? val.name.substr(6)
										: val.name
								}
								location={val.location}
								gridHeight={unitHeight}
								gridWidth={unitWidth}
								key={val.name + block.begin}
								onPress={() => {
									props.navigation.navigate("ScheduleDetail", {
										name: val.name,
										location: val.location,
										week: week,
										dayOfWeek: block.dayOfWeek,
										begin: block.begin,
										end: block.end,
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
						color={week > 1 ? "black" : "#888"}
					/>
				</TouchableOpacity>
				<Text
					onPress={() => setWeek(new Calendar().weekNumber)}
					style={{
						fontSize: 18,
						textAlign: "center",
						flex: 1,
					}}>
					{week}
				</Text>
				<TouchableOpacity
					onPress={() =>
						setWeek((o) => (week < Calendar.weekCount ? o + 1 : o))
					}
					disabled={week >= Calendar.weekCount}
					style={{padding: 8}}>
					<Icon
						name="chevron-right"
						size={24}
						color={week < Calendar.weekCount ? "black" : "#888"}
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
				</ViewShot>
			</ScrollView>
			<View style={{flexDirection: "row"}}>
				<OptionButton
					title={getStr("scheduleCustomShorten")}
					onPress={() => props.navigation.navigate("ScheduleShorten")}
				/>
				<OptionButton
					title={getStr("scheduleAddCustom")}
					onPress={() => props.navigation.navigate("ScheduleAdd")}
				/>
				<OptionButton
					title={getStr("scheduleSaveImg")}
					onPress={() => {
						// @ts-ignore
						viewShot.current.capture().then(saveImg);
					}}
				/>
				<OptionButton
					title={getStr("scheduleHidden")}
					onPress={() => props.navigation.navigate("ScheduleHidden")}
				/>
			</View>
		</>
	);
};

export const ScheduleScreen = connect(
	(state: State) => ({
		...state.schedule,
		unitHeight:
			state.config.scheduleHeight > 10 ? state.config.scheduleHeight : 10,
	}),
	(dispatch) => ({
		getSchedule: () => {
			// @ts-ignore
			dispatch(scheduleThunk());
		},
	}),
)(ScheduleUI);
