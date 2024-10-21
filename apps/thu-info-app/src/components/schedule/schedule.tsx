import {useState} from "react";
import {Text, TouchableOpacity, useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";

interface ScheduleBlockProps {
	dayOfWeek: number;
	begin: number;
	end: number;
	name: string;
	location: string;
	gridHeight: number;
	gridWidth: number;
	onPress: () => void;
	textColor?: string;
	blockColor?: string;
	blockMargin?: number;
}

export const ScheduleBlock = (props: ScheduleBlockProps) => {
	const themeName = useColorScheme();
	const { colors } = themes(themeName);

	const textColor = props.textColor || "white";

	const blockMargin = props.blockMargin || 2;
	const blockColor = props.blockColor || colors.themePurple;

	const blockLeftPos = (props.dayOfWeek - 1) * props.gridWidth + blockMargin;
	const blockTopPos = (props.begin - 1) * props.gridHeight + blockMargin;
	const blockRightPos = props.dayOfWeek * props.gridWidth - blockMargin;
	const blockBottomPos = props.end * props.gridHeight - blockMargin;

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
					color: textColor,
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
						color: textColor,
						fontSize: 8,
					}}>
					{"@" + props.location}
				</Text>
			) : null}
		</TouchableOpacity>
	);
};
