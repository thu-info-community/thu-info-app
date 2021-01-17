import {View, Text} from "react-native";
import React from "react";
import FontAwesome from "react-native-vector-icons/FontAwesome";

const beginTime = [
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
}

// TODO: delOrHide
export const ScheduleDetailScreen = ({route}: any) => {
	const props = route.params;
	return (
		<View style={{paddingVertical: 30, paddingHorizontal: 20}}>
			<Text style={{fontSize: 25, marginBottom: 20}} numberOfLines={1}>
				{props.name}
			</Text>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					marginVertical: 10,
				}}>
				<View
					style={{alignItems: "center", justifyContent: "center", width: 20}}>
					<FontAwesome name="map-marker" size={20} color="green" />
				</View>
				<Text style={{marginHorizontal: 10, color: "gray"}}>地点</Text>
				<Text style={{marginHorizontal: 15}}>{props.location}</Text>
			</View>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					marginVertical: 10,
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
		</View>
	);
};
