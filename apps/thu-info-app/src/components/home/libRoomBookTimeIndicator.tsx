import {LibRoomRes} from "@thu-info/lib/dist/models/home/library";
import {Text, useColorScheme, View} from "react-native";
import themes from "../../assets/themes/themes";
import dayjs from "dayjs";

export const timeDiff = (start: string, end: string): number => {
	const startH = Number(start.substring(0, 2));
	const startM = Number(start.substring(3, 5));
	const endH = Number(end.substring(0, 2));
	const endM = Number(end.substring(3, 5));
	return endH * 60 + endM - (startH * 60 + startM);
};

// start, duration(minute), occupied
export const convertUsageToSegments = (
	res: LibRoomRes,
): [string, number, boolean][] => {
	if (res.openStart === null || res.openEnd === null) {
		return [];
	}
	try {
		const sorted = [...res.usage].sort((a, b) => (a.start < b.start ? -1 : 1));
		const result: [string, number, boolean][] = [];
		let lastTime = res.openStart;
		for (let i = 0; i < sorted.length; i++) {
			const beginTime = dayjs(sorted[i].start).format("HH:mm");
			const endTime = dayjs(sorted[i].end).format("HH:mm");
			if (beginTime > lastTime) {
				result.push([lastTime, timeDiff(lastTime, beginTime), false]);
			}
			result.push([beginTime, timeDiff(beginTime, endTime), true]);
			lastTime = endTime;
		}
		if (res.openEnd > lastTime) {
			result.push([lastTime, timeDiff(lastTime, res.openEnd), false]);
		}
		return result;
	} catch {
		return [[res.openStart, timeDiff(res.openEnd, res.openStart), false]];
	}
};

export const LibRoomBookTimeIndicator = ({res}: {res: LibRoomRes}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	if (res.openStart === null || res.openEnd === null) {
		return (
			<View
				style={{
					flex: 1,
					backgroundColor: "lightgrey",
					height: 2,
					marginTop: 12,
				}}
			/>
		);
	}
	const startH = Number(res.openStart.substring(0, 2));
	const endH = Number(res.openEnd.substring(0, 2));
	return (
		<>
			<View style={{flexDirection: "row", paddingTop: 12}}>
				{convertUsageToSegments(res).map(([start, duration, occupied]) => (
					<View
						style={{
							flex: duration,
							backgroundColor: occupied ? "blue" : "lightgrey",
							height: 2,
						}}
						key={start}
					/>
				))}
			</View>
			<View style={{flexDirection: "row"}}>
				{Array.from(new Array(endH - startH)).map((_, index) => (
					<View
						style={{
							flex: 1,
							borderLeftColor: "lightgrey",
							borderLeftWidth: 1,
							borderRightColor: "lightgrey",
							borderRightWidth: index === endH - startH - 1 ? 1 : 0,
						}}
						key={index}>
						<Text style={{color: colors.text}}>{startH + index}</Text>
					</View>
				))}
			</View>
		</>
	);
};
