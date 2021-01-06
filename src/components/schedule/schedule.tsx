import React from "react";
import {View, Text} from "react-native";

interface ScheduleBlockProps {
	dayOfWeek: number;
	begin: number;
	end: number;
	name: string;
	location: string;
	gridHeight: number;
	gridWidth: number;
	blockColor?: string;
	blockInterval?: number;
}

export const ScheduleBlock = (props: ScheduleBlockProps) => {
	// TODO: maybe some special judge?
	const gridHalfWidth = props.gridWidth / 2;
	const gridHalfHeight = props.gridHeight / 2;

	const blockInterval = props.blockInterval || 2;
	const blockColor = props.blockColor || "red";

	const blockLeftPos =
		(props.dayOfWeek * 2 - 1) * gridHalfWidth + // Block Width
		(props.dayOfWeek + 1) + // Border Width
		blockInterval; // Block Interval
	const blockTopPos =
		(props.begin * 2 - 1) * gridHalfHeight + // Block Width
		([1, 3, 6, 8, 10, 12].indexOf(props.begin) === -1 ? 0 : 1) + // Border Width
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
		<View
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
			}}>
			<Text style={{textAlign: "center", color: "white"}}>
				{props.name + "@" + props.location}
			</Text>
		</View>
	);
};
