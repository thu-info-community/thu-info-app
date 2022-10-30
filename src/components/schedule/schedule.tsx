import {useState} from "react";
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

	const blockInterval = props.blockInterval || 1;
	const blockColor = props.blockColor || "#1f1e33";

	const blockLeftPos =
		(props.dayOfWeek * 2 - 2) * gridHalfWidth + // Block Width
		(props.dayOfWeek + 1) + // Border Width
		blockInterval; // Block Interval
	const blockTopPos =
		(props.begin * 2 - 2) * gridHalfHeight + // Block Width
		1 + // Border Width
		blockInterval; // Block Interval
	const blockRightPos =
		props.dayOfWeek * 2 * gridHalfWidth + // Block Width
		(props.dayOfWeek + 1) - // Border Width
		blockInterval; // Block Interval
	const blockBottomPos =
		props.end * 2 * gridHalfHeight - // Block Width
		([2, 5, 7, 9, 11].indexOf(props.end) === -1 ? 0 : 1) - // Border Width
		blockInterval; // Block Interval

	const [titleHeight, setTitleHeight] = useState(0);
	const [localeHeight, setLocaleHeight] = useState(0);
	const [overflow, setOverflow] = useState(false);

	if (titleHeight + localeHeight > blockBottomPos - blockTopPos && !overflow) {
		setOverflow(true);
	}

	return (
		<TouchableOpacity
			style={{
				position: "absolute",
				left: blockLeftPos,
				top: blockTopPos,
				width: blockRightPos - blockLeftPos,
				height: blockBottomPos - blockTopPos,
				backgroundColor: blockColor,
				borderRadius: 4,
				paddingVertical: 4,
				paddingHorizontal: 2,
			}}
			onPress={props.onPress}>
			<Text
				onLayout={({nativeEvent}) => {
					setTitleHeight(nativeEvent.layout.height);
				}}
				style={{
					maxHeight: overflow
						? blockBottomPos - blockTopPos - localeHeight - 5
						: blockBottomPos - blockTopPos,
					textAlign: "left",
					color: "white",
					lineHeight: 18,
					fontWeight: "bold",
					fontSize: 13,
				}}>
				{props.name}
			</Text>
			{props.location.length ? (
				<Text
					onLayout={({nativeEvent}) => {
						setLocaleHeight(nativeEvent.layout.height);
					}}
					numberOfLines={3}
					style={{
						textAlign: "left",
						color: "white",
						fontSize: 8,
					}}>
					{"@" + props.location}
				</Text>
			) : null}
		</TouchableOpacity>
	);
};
