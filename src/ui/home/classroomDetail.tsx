import {FlatList, Text, TouchableOpacity, View} from "react-native";
import React, {useEffect, useRef, useState} from "react";
import {getClassroomState} from "../../network/basics";
import {ClassroomDetailRouteProp} from "./homeStack";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {Calendar} from "../../utils/calendar";
import Icon from "react-native-vector-icons/FontAwesome";

const colors = ["#26A69A", "#FFA726", "#29B6F6", "#868686", "#AB47BC"];

export const ClassroomDetailScreen = ({
	route,
}: {
	route: ClassroomDetailRouteProp;
}) => {
	const name = route.params.name;
	const [data, setData] = useState<[number, number, [string, number[]][]]>([
		new Calendar().weekNumber,
		new Calendar().dayOfWeek,
		[],
	]);
	const prev = useRef<[number, [string, number[]][]]>();
	const next = useRef<[number, [string, number[]][]]>();
	const currWeek = data[0];
	const [refreshing, setRefreshing] = useState(false);

	const refresh = () => {
		setRefreshing(true);
		getClassroomState(name, data[0])
			.then((res) =>
				setData((o) => {
					if (o[0] === data[0]) {
						setRefreshing(false);
						return [o[0], o[1], res];
					} else {
						return o;
					}
				}),
			)
			.catch(() =>
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				}),
			);
	};

	useEffect(() => {
		if (prev.current && data[0] === prev.current[0]) {
			next.current = [data[0] + 1, data[2]];
			setData([data[0], data[1], prev.current[1]]);
			prev.current = undefined;
		} else if (next.current && data[0] === next.current[0]) {
			prev.current = [data[0] - 1, data[2]];
			setData([data[0], data[1], next.current[1]]);
			next.current = undefined;
		} else {
			refresh();
		}
		if (
			data[0] > 1 &&
			(prev.current === undefined || prev.current[0] !== data[0] - 1)
		) {
			getClassroomState(name, data[0] - 1).then(
				(res) => (prev.current = [data[0] - 1, res]),
			);
		}
		if (
			data[0] < Calendar.weekCount &&
			(next.current === undefined || next.current[0] !== data[0] + 1)
		) {
			getClassroomState(name, data[0] + 1).then(
				(res) => (next.current = [data[0] + 1, res]),
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currWeek]);

	return (
		<>
			<View
				style={{
					padding: 4,
					justifyContent: "space-between",
					alignItems: "center",
					flexDirection: "row",
				}}>
				<TouchableOpacity
					onPress={() =>
						setData(([week, day, table]) =>
							day > 1
								? [week, day - 1, table]
								: week > 1
								? [week - 1, 7, table]
								: [week, day, table],
						)
					}
					disabled={data[0] === 1 && data[1] === 1}
					style={{padding: 8}}>
					<Icon
						name="chevron-left"
						size={24}
						color={data[0] === 1 && data[1] === 1 ? "#888" : "black"}
					/>
				</TouchableOpacity>
				<Text
					onPress={() =>
						setData(([_, day, table]) => [
							new Calendar().weekNumber,
							day,
							table,
						])
					}
					style={{
						fontSize: 18,
						textAlign: "center",
						flex: 1,
					}}>
					{getStr("classroomHeaderPrefix") +
						data[0] +
						getStr("classroomHeaderMiddle") +
						getStr("dayOfWeek")[data[1]]}
				</Text>
				<TouchableOpacity
					onPress={() =>
						setData(([week, day, table]) =>
							day < 7
								? [week, day + 1, table]
								: week < Calendar.weekCount
								? [week + 1, 1, table]
								: [week, day, table],
						)
					}
					disabled={data[0] === Calendar.weekCount && data[1] === 7}
					style={{padding: 8}}>
					<Icon
						name="chevron-right"
						size={24}
						color={
							data[0] === Calendar.weekCount && data[1] === 7 ? "#888" : "black"
						}
					/>
				</TouchableOpacity>
			</View>
			<View
				style={{
					flexWrap: "wrap",
					flexDirection: "row",
					alignItems: "center",
					margin: 4,
				}}>
				{colors.flatMap((color, index) => [
					<View
						style={{backgroundColor: color, width: 14, height: 14, margin: 2}}
						key={index + 1}
					/>,
					<Text key={-index}>{getStr("classroomStatus")[index]}</Text>,
				])}
			</View>
			<FlatList
				data={data[2]}
				refreshing={refreshing}
				onRefresh={refresh}
				renderItem={({item}) => (
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginHorizontal: 8,
						}}>
						<Text style={{flex: 1, textAlign: "center", fontSize: 15}}>
							{item[0]}
						</Text>
						{Array.from(new Array(6), (_, index) => (
							<View
								style={{
									backgroundColor:
										colors[item[1][(data[1] - 1) * 6 + index]] ?? "white",
									width: 20,
									height: 20,
									margin: 2,
								}}
								key={index}
							/>
						))}
					</View>
				)}
				keyExtractor={(item, index) => item[0] + index}
			/>
		</>
	);
};
