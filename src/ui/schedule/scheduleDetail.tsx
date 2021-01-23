import {View, Text, Dimensions, TouchableOpacity} from "react-native";
import React from "react";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import {Choice} from "src/redux/reducers/schedule";
import {TimeBlock} from "src/models/schedule/schedule";
import {connect} from "react-redux";
import {SCHEDULE_DEL_OR_HIDE} from "src/redux/constants";

const beginTime = [
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

const endTime = [
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

const dayOfWeekChar = ["", "一", "二", "三", "四", "五", "六", "日"];

export interface ScheduleDetailProps {
	name: string;
	location: string;
	week: number;
	dayOfWeek: number;
	begin: number;
	end: number;
	deleteFunc: (title: string, block: TimeBlock, choice: Choice) => void;
}

// TODO: delOrHide
const ScheduleDetailUI = (props: ScheduleDetailProps) => {
	const lineLength = Dimensions.get("window").width * 0.9;
	const horizontalLine = () => (
		<View
			style={{
				backgroundColor: "lightgray",
				height: 1,
				width: lineLength,
				margin: 5,
			}}
		/>
	);

	const delButton = (choice: Choice) => {
		const buttonText: string =
			choice === Choice.ALL
				? "删除所有时段该计划"
				: choice === Choice.REPEAT
				? "删除每周同时段该计划"
				: "删除该时段计划";
		return (
			<TouchableOpacity
				style={{
					borderRadius: 2,
					backgroundColor: "white",
					alignSelf: "stretch",
					justifyContent: "center",
					alignItems: "center",
					shadowColor: "gray",
					shadowOpacity: 0.8,
					shadowRadius: 2,
					shadowOffset: {height: 2, width: 2},
					margin: 5,
					padding: 12,
				}}>
				<Text
					style={{fontWeight: "bold", fontSize: 18}}
					onPress={() =>
						props.deleteFunc(
							props.name,
							{
								week: props.week,
								dayOfWeek: props.dayOfWeek,
								begin: props.begin,
								end: props.end,
							},
							choice,
						)
					}>
					{buttonText}
				</Text>
			</TouchableOpacity>
		);
	};

	return (
		<View
			style={{
				paddingVertical: 30,
				paddingHorizontal: 20,
				alignItems: "center",
			}}>
			<Text
				style={{
					fontSize: 25,
					marginBottom: 20,
					lineHeight: 30,
					alignSelf: "flex-start",
				}}
				numberOfLines={2}>
				{props.name}
			</Text>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					marginVertical: 10,
					alignSelf: "flex-start",
				}}>
				<View
					style={{alignItems: "center", justifyContent: "center", width: 20}}>
					<FontAwesome name="map-marker" size={20} color="red" />
				</View>
				<Text style={{marginHorizontal: 10, color: "gray"}}>地点</Text>
				<Text style={{marginHorizontal: 15}}>{props.location}</Text>
			</View>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					marginVertical: 10,
					alignSelf: "flex-start",
				}}>
				<View
					style={{alignItems: "center", justifyContent: "center", width: 20}}>
					<FontAwesome name="list-alt" size={20} color="blue" />
				</View>
				<Text style={{marginHorizontal: 10, color: "gray"}}>节数</Text>
				<Text style={{marginLeft: 15}}>{"第" + props.week + "周"}</Text>
				<Text style={{marginLeft: 5}}>
					{"周" + dayOfWeekChar[props.dayOfWeek]}
				</Text>
				<Text style={{marginLeft: 5}}>
					{"第" +
						props.begin +
						(props.begin === props.end ? "" : " ~ " + props.end) +
						"节"}
				</Text>
				<Text style={{marginLeft: 5, color: "gray"}}>
					{"（" + beginTime[props.begin] + " ~ " + endTime[props.end] + "）"}
				</Text>
			</View>
			{horizontalLine()}
			<Text>TODO</Text>
			{horizontalLine()}
			{delButton(Choice.ONCE)}
			{delButton(Choice.REPEAT)}
			{delButton(Choice.ALL)}
		</View>
	);
};

export const ScheduleDetailScreen = connect(
	(state: State) => ({
		...state.schedule,
		unitHeight:
			state.config.scheduleHeight > 10 ? state.config.scheduleHeight : 10,
	}),
	(dispatch) => ({
		deleteFunc: (title: string, block: TimeBlock, choice: Choice) => {
			dispatch({type: SCHEDULE_DEL_OR_HIDE, payload: [title, block, choice]});
		},
	}),
)(ScheduleDetailUI);
