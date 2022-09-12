import {
	FlatList,
	RefreshControl,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {useEffect, useRef, useState} from "react";
import {ClassroomDetailRouteProp} from "../../components/Root";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import IconRight from "../../assets/icons/IconRight";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import {helper} from "../../redux/store";
import dayjs from "dayjs";

const colors = ["#26A69A", "#FFA726", "#29B6F6", "#868686", "#AB47BC"];

export const ClassroomDetailScreen = ({
	route: {
		params: {searchName, weekNumber},
	},
}: {
	route: ClassroomDetailRouteProp;
}) => {
	const weekCount = 18;
	const current = dayjs();
	const dayOfWeek = current.day() === 0 ? 7 : current.day();

	const [data, setData] = useState<[number, number, [string, number[]][]]>([
		Math.max(weekNumber, 1),
		dayOfWeek,
		[],
	]);
	const prev = useRef<[number, [string, number[]][]]>();
	const next = useRef<[number, [string, number[]][]]>();
	const currWeek = data[0];
	const [refreshing, setRefreshing] = useState(false);

	const themeName = useColorScheme();
	const theme = themes(themeName);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getClassroomState(searchName, currWeek)
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
			helper
				.getClassroomState(searchName, data[0] - 1)
				.then((res) => (prev.current = [data[0] - 1, res]));
		}
		if (
			data[0] < weekCount &&
			(next.current === undefined || next.current[0] !== data[0] + 1)
		) {
			helper
				.getClassroomState(searchName, data[0] + 1)
				.then((res) => (next.current = [data[0] + 1, res]));
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
					{/* <Icon
						name="chevron-left"
						size={24}
						color={data[0] === 1 && data[1] === 1 ? "#888" : theme.colors.text}
					/> */}
					<IconRight height={24} width={24} />
				</TouchableOpacity>
				<Text
					style={{
						fontSize: 18,
						textAlign: "center",
						flex: 1,
						marginHorizontal: 10,
						color: theme.colors.text,
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
								: week < weekCount
								? [week + 1, 1, table]
								: [week, day, table],
						)
					}
					disabled={data[0] === weekCount && data[1] === 7}
					style={{padding: 8}}>
					{/* <Icon
						name="chevron-right"
						size={24}
						color={
							data[0] === weekCount && data[1] === 7
								? "#888"
								: theme.colors.text
						}
					/> */}
					<IconRight height={24} width={24} />
				</TouchableOpacity>
			</View>
			<View
				style={{
					flexWrap: "wrap",
					flexDirection: "row",
					justifyContent: "space-around",
					alignItems: "center",
					margin: 4,
				}}>
				{colors.flatMap((color, index) => [
					<View
						style={{
							flexDirection: "row",
							justifyContent: "center",
							alignItems: "center",
							marginHorizontal: 3,
						}}
						key={index}>
						<View
							style={{backgroundColor: color, width: 14, height: 14, margin: 2}}
						/>
						<Text style={{marginLeft: 2, color: theme.colors.text}}>
							{getStr("classroomStatus")[index]}
						</Text>
					</View>,
				])}
			</View>
			<FlatList
				data={data[2]}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
						colors={[theme.colors.accent]}
					/>
				}
				style={{
					marginHorizontal: 20,
					marginTop: 10,
				}}
				ListHeaderComponent={
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginHorizontal: 0,
							justifyContent: "space-around",
							marginBottom: 4,
						}}>
						<Text
							style={{
								flex: 4,
								textAlign: "center",
								fontSize: 15,
								fontWeight: "bold",
								color: theme.colors.text,
							}}>
							{getStr("classroomName")}
						</Text>
						<Text
							style={{
								flex: 4,
								textAlign: "center",
								fontSize: 15,
								fontWeight: "bold",
								color: theme.colors.text,
							}}>
							{getStr("classroomCapacity")}
						</Text>
						<View style={{flex: 5}}>
							<Text
								style={{
									textAlign: "center",
									fontSize: 15,
									fontWeight: "bold",
									marginBottom: 2,
									color: theme.colors.text,
								}}>
								{getStr("classroomCondition")}
							</Text>
							<View
								style={{
									flexDirection: "row",
									justifyContent: "space-around",
									alignItems: "center",
								}}>
								{[1, 2, 3, 4, 5, 6].map((val) => (
									<Text
										key={val}
										style={{
											flex: 1,
											textAlign: "center",
											color: theme.colors.text,
										}}>
										{val}
									</Text>
								))}
							</View>
						</View>
					</View>
				}
				renderItem={({item}) => (
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							marginHorizontal: 0,
							justifyContent: "space-around",
						}}>
						<Text
							style={{
								flex: 1,
								textAlign: "center",
								fontSize: 15,
								fontWeight: "bold",
								color: theme.colors.text,
							}}>
							{item[0].split(":")[0]}
						</Text>
						<Text
							style={{
								flex: 1,
								textAlign: "center",
								fontSize: 15,
								color: theme.colors.text,
							}}>
							{item[0].split(":")[1]}
						</Text>
						{Array.from(new Array(6)).map((_, index) => (
							<View
								style={{
									backgroundColor:
										colors[item[1][(data[1] - 1) * 6 + index]] ?? "#E2E2E2",
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
