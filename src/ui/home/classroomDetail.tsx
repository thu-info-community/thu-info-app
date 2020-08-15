import {FlatList, Text, TouchableOpacity, View} from "react-native";
import React, {useEffect, useState} from "react";
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
	// const [refreshing, setRefreshing] = useState(false);

	const refresh = () => {
		getClassroomState(name, data[0])
			.then((res) =>
				setData((o) => {
					if (o[0] === data[0]) {
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

	useEffect(refresh, [data[0]]);

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
						setData(([week, day, table]) => [
							week > 1 ? week - 1 : week,
							day,
							table,
						])
					}
					disabled={data[0] <= 1}
					style={{padding: 8}}>
					<Icon
						name="chevron-left"
						size={24}
						color={data[0] > 1 ? "black" : "#888"}
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
					{data[0]}
				</Text>
				<TouchableOpacity
					onPress={() =>
						setData(([week, day, table]) => [
							week < Calendar.weekCount ? week + 1 : week,
							day,
							table,
						])
					}
					disabled={data[0] >= Calendar.weekCount}
					style={{padding: 8}}>
					<Icon
						name="chevron-right"
						size={24}
						color={data[0] < Calendar.weekCount ? "black" : "#888"}
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
