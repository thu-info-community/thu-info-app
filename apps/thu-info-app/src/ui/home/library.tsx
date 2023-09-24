import {
	Alert,
	RefreshControl,
	ScrollView,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {RootNav} from "../../components/Root";
import {useEffect, useState} from "react";
import IconRight from "../../assets/icons/IconRight";
import {helper, State} from "../../redux/store";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";
import {NetworkRetry} from "../../components/easySnackbars";
import {Library} from "thu-info-lib/dist/models/home/library";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {setActiveLibBookRecord} from "../../redux/slices/reservation";
import dayjs from "dayjs";
import {useDispatch, useSelector} from "react-redux";

export const LibraryReservationCard = () => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const activeLibBookRecords =
		useSelector((s: State) => s.reservation.activeLibBookRecords) ?? [];
	const dispatch = useDispatch();

	const transformedRecords = activeLibBookRecords
		.map((e) => ({
			...e,
			lib: e.pos.substring(0, e.pos.indexOf(":")).replace(/-/g, " - "),
			seat: e.pos.substring(e.pos.indexOf(":") + 1),
			due: dayjs(e.time, "YYYY-MM-DD HH:mm").add(30, "minute"),
		}))
		.filter((e) => e.due.add(30, "minute").valueOf() > dayjs().valueOf())
		.sort((a, b) => a.due.valueOf() - b.due.valueOf());

	return (
		<RoundedView
			style={{
				alignItems: "center",
				justifyContent: "center",
			}}>
			{transformedRecords.length === 0 ? (
				<Text style={{color: colors.text}}>
					{getStr("noActiveLibBookRecord")}
				</Text>
			) : (
				<>
					<Text style={{color: colors.text}}>{transformedRecords[0].lib}</Text>
					<View
						style={{
							padding: 10,
							flexDirection: "row",
							alignItems: "center",
						}}>
						<Text
							style={{
								fontSize: 20,
								fontWeight: "600",
								color: colors.text,
							}}>
							{transformedRecords[0].seat}
						</Text>
						{transformedRecords[0].delId !== undefined &&
							((delId: string, pos: string) => (
								<TouchableOpacity
									onPress={() =>
										Alert.alert(
											getStr("confirmCancelBooking"),
											pos,
											[
												{text: getStr("cancel")},
												{
													text: getStr("confirm"),
													onPress: () => {
														helper
															.cancelBooking(delId)
															.then(() =>
																Snackbar.show({
																	text: getStr("cancelSucceeded"),
																	duration: Snackbar.LENGTH_SHORT,
																}),
															)
															.catch((e) => {
																Snackbar.show({
																	text:
																		typeof e.message === "string"
																			? e.message
																			: getStr("networkRetry"),
																	duration: Snackbar.LENGTH_SHORT,
																});
															})
															.then(helper.getBookingRecords)
															.then((r) => {
																dispatch(setActiveLibBookRecord(r));
															});
													},
												},
											],
											{cancelable: true},
										)
									}>
									<Text
										style={{
											color: colors.primaryLight,
											marginLeft: 12,
											textDecorationLine: "underline",
										}}>
										{getStr("cancelBooking")}
									</Text>
								</TouchableOpacity>
							))(transformedRecords[0].delId, transformedRecords[0].pos)}
					</View>
					<Text style={{textAlign: "center", color: colors.text}}>
						{getStr("bookingHintPrefix")}
						<Text style={{fontWeight: "bold"}}>
							{transformedRecords[0].due.format("HH:mm")}
						</Text>
						{getStr("bookingHintSuffix")}
					</Text>
				</>
			)}
		</RoundedView>
	);
};

export const LibraryScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const [refreshing, setRefreshing] = useState(false);
	const [libraryList, setLibraryList] = useState<Library[]>([]);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getLibraryList()
			.then(setLibraryList)
			.catch(NetworkRetry)
			.then(() => setRefreshing(false));
	};

	useEffect(() => {
		refresh();
	}, []);

	return (
		<ScrollView
			style={{flex: 1}}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
					colors={[colors.accent]}
				/>
			}>
			<>
				{libraryList.length > 0 && (
					<RoundedView style={{margin: 16}}>
						{libraryList.map((library, index) => (
							<View key={library.id}>
								{index > 0 && (
									<View
										style={{
											borderWidth: 0.4,
											marginHorizontal: 16,
											borderColor: colors.themeGrey,
										}}
									/>
								)}
								<TouchableOpacity
									disabled={!library.valid}
									onPress={() =>
										library.valid &&
										navigation.navigate("LibraryFloor", {
											library,
											dateChoice: 0,
										})
									}
									style={{
										flexDirection: "row",
										justifyContent: "space-between",
										alignItems: "center",
										marginHorizontal: 16,
										marginTop: index === 0 ? 0 : 12,
										marginBottom: index === libraryList.length - 1 ? 0 : 12,
									}}>
									<Text
										style={{
											fontSize: 16,
											color: library.valid ? colors.text : colors.fontB2,
										}}>
										{library.zhName}
									</Text>
									<IconRight height={16} width={16} />
								</TouchableOpacity>
							</View>
						))}
					</RoundedView>
				)}
				<View style={{margin: 16}}>
					<Text
						style={{
							fontWeight: "bold",
							color: colors.text,
							marginBottom: 8,
						}}>
						{getStr("alreadyReserved")}
					</Text>
					<LibraryReservationCard />
				</View>
			</>
		</ScrollView>
	);
};
