import React from "react";
import {Text, TouchableOpacity} from "react-native";

interface ScheduleBlockProps {
	dayOfWeek: number;
	begin: number;
	end: number;
	name: string;
	location: string;
	gridHeight: number;
	gridWidth: number;
	onPress: () => void;
	blockColor?: string;
	blockInterval?: number;
}

export const ScheduleBlock = (props: ScheduleBlockProps) => {
	// TODO: maybe some special judge?
	const gridHalfWidth = props.gridWidth / 2;
	const gridHalfHeight = props.gridHeight / 2;

	const blockInterval = props.blockInterval || 2;
	const blockColor = props.blockColor || "#1f1e33";

	const blockLeftPos =
		(props.dayOfWeek * 2 - 1) * gridHalfWidth + // Block Width
		(props.dayOfWeek + 1) + // Border Width
		blockInterval; // Block Interval
	const blockTopPos =
		(props.begin * 2 - 1) * gridHalfHeight + // Block Width
		1 + // Border Width
		blockInterval; // Block Interval
	const blockRightPos =
		(props.dayOfWeek * 2 + 1) * gridHalfWidth + // Block Width
		(props.dayOfWeek + 1) - // Border Width
		blockInterval; // Block Interval
	const blockBottomPos =
		(props.end * 2 + 1) * gridHalfHeight - // Block Width
		([2, 5, 7, 9, 11].indexOf(props.end) === -1 ? 0 : 1) - // Border Width
		blockInterval; // Block Interval

	return (
		<TouchableOpacity
			style={{
				position: "absolute",
				left: blockLeftPos,
				top: blockTopPos,
				width: blockRightPos - blockLeftPos,
				height: blockBottomPos - blockTopPos,
				backgroundColor: blockColor,
				borderRadius: 5,
				alignContent: "center",
				justifyContent: "center",
			}}
			onPress={props.onPress}>
			<Text style={{textAlign: "center", color: "white"}}>
				{props.name + "@" + props.location}
			</Text>
		</TouchableOpacity>
	);
};
