import React, {useEffect, useState} from "react";
import {
	FlatList,
	Pressable,
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
import {LibRoomBookTimeIndicator} from "../../components/home/libRoomBookTimeIndicator";
import {HomeNav} from "./homeStack";

export const LibRoomBookScreen = ({navigation}: {navigation: HomeNav}) => {
	const [rooms, setRooms] = useState<LibRoomRes[]>([]);
	const [dateOffset, setDateOffset] = useState<0 | 1 | 2>(0);
	const [refreshing, setRefreshing] = useState(false);

	const themeName = useColorScheme();
	const theme = themes(themeName);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getLibraryRoomBookingResourceList(
				dayjs().add(dateOffset, "day").format("YYYYMMDD"),
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
				renderItem={({item}) => (
					<Pressable
						onPress={() =>
							item.openStart !== null &&
							item.openEnd !== null &&
							navigation.navigate("LibRoomPerformBook", {
								res: item,
								date: dayjs().add(dateOffset, "day").format("YYYY-MM-DD"),
							})
						}>
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
								{item.maxUser > 1 ? ` (${item.minUser}~${item.maxUser})` : ""}
							</Text>
							<Text style={{color: "grey"}}>{item.kindName}</Text>
							<LibRoomBookTimeIndicator res={item} />
						</View>
					</Pressable>
				)}
				keyExtractor={({id}) => id}
			/>
		</>
	);
};
