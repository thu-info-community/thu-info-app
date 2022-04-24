import React, {useEffect, useState} from "react";
import {
	Dimensions,
	FlatList,
	RefreshControl,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import Snackbar from "react-native-snackbar";
import {
	LibName,
	LibRoomRes,
	validLibName,
} from "thu-info-lib/dist/models/home/library";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {helper} from "../../redux/store";
import dayjs from "dayjs";
import {LibRoomBookTimeIndicator} from "../../components/home/libRoomBookTimeIndicator";
import {RootNav} from "../../components/Root";
import {PickerModalWrapper} from "src/components/home/PickerModalWrapper";

const validLibNameCN = ["北馆", "西馆", "法图", "文图"];

const libNameToString = (o: LibName) => validLibNameCN[validLibName.indexOf(o)];

const stringToLibName = (str: string) =>
	validLibName[validLibNameCN.indexOf(str)];

export const LibRoomBookScreen = ({navigation}: {navigation: RootNav}) => {
	let screenHeight = Dimensions.get("window");

	const [rooms, setRooms] = useState<LibRoomRes[]>([]);
	const [dateOffset, setDateOffset] = useState<0 | 1 | 2 | 3 | 4>(0);
	const [refreshing, setRefreshing] = useState(false);

	const [selectLib, setLib] = useState<LibName | undefined>(undefined);
	const [isSingle, setSingle] = useState<boolean | undefined>(undefined);

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
			{!helper.mocked() && (
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
					<View style={{flexDirection: "row", margin: 5}}>
						<TouchableOpacity
							style={{padding: 3, flex: 1}}
							onPress={() => setDateOffset(3)}>
							<Text
								style={{
									color: dateOffset === 3 ? "blue" : theme.colors.text,
									textAlign: "center",
								}}>
								{dayjs().add(3, "day").format("YYYY-MM-DD")}
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={{padding: 3, flex: 1}}
							onPress={() => setDateOffset(4)}>
							<Text
								style={{
									color: dateOffset === 4 ? "blue" : theme.colors.text,
									textAlign: "center",
								}}>
								{dayjs().add(4, "day").format("YYYY-MM-DD")}
							</Text>
						</TouchableOpacity>
					</View>
					<View style={{paddingHorizontal: 8}}>
						<PickerModalWrapper
							defaultValue={[
								isSingle === undefined
									? "请选择单人或团体"
									: isSingle
									? "单人"
									: "团体",
								selectLib === undefined ? "请选择图书馆" : selectLib,
							]}
							// TODO: Is it good or safe?
							items={[["单人", "团体"], validLibName.map(libNameToString)]}
							text={["人数", "图书馆"]}
							onLeftSelect={(value) => setSingle(value === "单人")}
							onRightSelect={(value) => setLib(stringToLibName(value))}
							isModalGroup={false}
							rightPickerRef={undefined}
							containerPadding={8}
						/>
					</View>
				</>
			)}
			<FlatList
				style={{flex: 1}}
				data={rooms
					.filter((val) =>
						selectLib === undefined ? true : val.loc === selectLib,
					)
					.filter((val) =>
						isSingle === undefined ? true : (val.maxUser === 1) === isSingle,
					)
					.sort((a, b) => {
						const [av, bv] = [a, b].map(
							(val) => val.kindName.indexOf("暂未开放") !== -1,
						);
						if ((av && bv) || (!av && !bv)) {
							return a.roomName.localeCompare(b.roomName, "zh-CN");
						} else {
							return av ? 1 : -1;
						}
					})}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refresh}
						colors={[theme.colors.accent]}
					/>
				}
				renderItem={({item}) => (
					<TouchableOpacity
						onPress={() =>
							item.openStart !== null &&
							item.openEnd !== null &&
							navigation.navigate("LibRoomPerformBook", {
								res: item,
								date: dayjs().add(dateOffset, "day").format("YYYY-MM-DD"),
							})
						}
						disabled={item.kindName.indexOf("暂未开放") !== -1}>
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
							<Text
								style={{
									color:
										item.kindName.indexOf("暂未开放") === -1
											? theme.colors.text
											: "gray",
									fontSize: 18,
									marginBottom: 4,
									textDecorationLine:
										item.kindName.indexOf("暂未开放") === -1
											? "none"
											: "line-through",
								}}>
								{item.roomName}
								{item.maxUser > 1 ? ` (${item.minUser}~${item.maxUser})` : ""}
							</Text>
							<Text style={{color: "grey", marginBottom: 4}}>
								{item.kindName}
							</Text>
							<LibRoomBookTimeIndicator res={item} />
						</View>
					</TouchableOpacity>
				)}
				keyExtractor={({id}) => id}
				ListEmptyComponent={
					<View
						style={{
							margin: 15,
							height: screenHeight.height * 0.7,
							justifyContent: "center",
							alignItems: "center",
						}}>
						<Text
							style={{
								fontSize: 18,
								fontWeight: "bold",
								alignSelf: "center",
								margin: 5,
								color: theme.colors.text,
							}}>
							没有符合条件的研读间
						</Text>
					</View>
				}
			/>
		</>
	);
};
