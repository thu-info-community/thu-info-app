import React, {useEffect, useState} from "react";
import {
	FlatList,
	RefreshControl,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import Snackbar from "react-native-snackbar";
import {LibRoomRes} from "thu-info-lib/dist/models/home/library";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {helper} from "../../redux/store";
import dayjs from "dayjs";

const timeDiff = (start: string, end: string): number => {
	const startH = Number(start.substring(0, 2));
	const startM = Number(start.substring(3, 5));
	const endH = Number(end.substring(0, 2));
	const endM = Number(end.substring(3, 5));
	return endH * 60 + endM - (startH * 60 + startM);
};

// start, duration(minute), occupied
const convertUsageToSegments = (
	res: LibRoomRes,
): [string, number, boolean][] => {
	try {
		const sorted = [...res.usage].sort((a, b) => (a.start < b.start ? -1 : 1));
		const result: [string, number, boolean][] = [];
		let lastTime = res.openStart;
		for (let i = 0; i < sorted.length; i++) {
			if (sorted[i].start > lastTime) {
				result.push([lastTime, timeDiff(lastTime, sorted[i].start), false]);
			}
			result.push([
				sorted[i].start,
				timeDiff(sorted[i].start, sorted[i].end),
				true,
			]);
			lastTime = sorted[i].end;
		}
		if (res.openEnd > lastTime) {
			result.push([lastTime, timeDiff(lastTime, res.openEnd), false]);
		}
		return result;
	} catch {
		return [[res.openStart, timeDiff(res.openEnd, res.openStart), false]];
	}
};

export const LibRoomBookScreen = () => {
	const [rooms, setRooms] = useState<LibRoomRes[]>([]);
	const [dateOffset, setDateOffset] = useState<0 | 1 | 2>(0);
	const [refreshing, setRefreshing] = useState(false);

	const themeName = useColorScheme();
	const theme = themes(themeName);

	useEffect(() => {
		Snackbar.show({
			text: "实验性功能，当前只支持文图个人研读间预约。",
			duration: Snackbar.LENGTH_LONG,
		});
	}, []);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getLibraryRoomBookingResourceList(
				dayjs().add(dateOffset, "day").format("YYYYMMDD"),
				10311,
			)
			.then(setRooms)
			.catch(() =>
				Snackbar.show({
					text: getStr("networkRetry"),
					duration: Snackbar.LENGTH_SHORT,
				}),
			)
			.then(() => setRefreshing(false));
	};

	useEffect(() => {
		refresh();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [dateOffset]);

	return (
		<>
			<View style={{flexDirection: "row", margin: 5}}>
				<TouchableOpacity
					style={{padding: 3, flex: 1}}
					onPress={() => setDateOffset(0)}>
					<Text
						style={{
							color: dateOffset === 0 ? "blue" : theme.colors.text,
							textAlign: "center",
						}}>
						{dayjs().add(0, "day").format("YYYY-MM-DD")}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={{padding: 3, flex: 1}}
					onPress={() => setDateOffset(1)}>
					<Text
						style={{
							color: dateOffset === 1 ? "blue" : theme.colors.text,
							textAlign: "center",
						}}>
						{dayjs().add(1, "day").format("YYYY-MM-DD")}
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={{padding: 3, flex: 1}}
					onPress={() => setDateOffset(2)}>
					<Text
						style={{
							color: dateOffset === 2 ? "blue" : theme.colors.text,
							textAlign: "center",
						}}>
						{dayjs().add(2, "day").format("YYYY-MM-DD")}
					</Text>
				</TouchableOpacity>
			</View>
			<FlatList
				style={{flex: 1}}
				data={rooms}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
						colors={[theme.colors.accent]}
					/>
				}
				renderItem={({item}) => {
					const startH = Number(item.openStart.substring(0, 2));
					const endH = Number(item.openEnd.substring(0, 2));
					return (
						<View
							style={{
								backgroundColor: theme.colors.background,
								justifyContent: "center",
								padding: 15,
								marginVertical: 8,
								marginHorizontal: 16,
								shadowColor: "grey",
								shadowOffset: {
									width: 2,
									height: 2,
								},
								shadowOpacity: 0.8,
								shadowRadius: 2,
								borderRadius: 5,
								elevation: 2,
							}}>
							<Text style={{color: theme.colors.text, fontSize: 18}}>
								{item.roomName}
							</Text>
							<Text style={{color: "grey"}}>{item.kindName}</Text>
							<View style={{flexDirection: "row", paddingTop: 12}}>
								{convertUsageToSegments(item).map(
									([start, duration, occupied]) => (
										<View
											style={{
												flex: duration,
												backgroundColor: occupied ? "blue" : undefined,
												height: 2,
											}}
											key={start}
										/>
									),
								)}
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
										<Text>{startH + index}</Text>
									</View>
								))}
							</View>
						</View>
					);
				}}
				keyExtractor={({id}) => id}
			/>
		</>
	);
};
