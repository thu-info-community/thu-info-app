import React from "react";
import {View, Text} from "react-native";
import {Lesson} from "src/models/schedule/schedule";

interface ScheduleProps {
	lessonInfo: Lesson;
	gridHeight: number;
	gridWidth: number;
	blockColor?: string;
	blockInterval?: number;
}

export const Schedule = (props: ScheduleProps) => {
	// TODO: maybe some special judge?
	let lessonInfo: Lesson = props.lessonInfo;

	const gridHalfWidth = props.gridWidth / 2;
	const gridHalfHeight = props.gridHeight / 2;

	const blockInterval = props.blockInterval || 2;
	const blockColor = props.blockColor || "red";

	const blockLeftPos =
		(lessonInfo.dayOfWeek * 2 - 1) * gridHalfWidth + // Block Width
		(lessonInfo.dayOfWeek + 1) + // Border Width
		blockInterval; // Block Interval
	const blockTopPos =
		(lessonInfo.begin * 2 - 1) * gridHalfHeight + // Block Width
		([1, 3, 6, 8, 10, 12].indexOf(lessonInfo.begin) === -1 ? 0 : 1) + // Border Width
		blockInterval; // Block Interval
	const blockRightPos =
		(lessonInfo.dayOfWeek * 2 + 1) * gridHalfWidth + // Block Width
		(lessonInfo.dayOfWeek + 1) - // Border Width
		blockInterval; // Block Interval
	const blockBottomPos =
		(lessonInfo.end * 2 + 1) * gridHalfHeight - // Block Width
		([2, 5, 7, 9, 11].indexOf(lessonInfo.end) === -1 ? 0 : 1) - // Border Width
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
				{lessonInfo.title + "@" + lessonInfo.locale}
			</Text>
		</View>
	);
};
