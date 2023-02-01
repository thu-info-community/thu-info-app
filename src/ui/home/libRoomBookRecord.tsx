import {
	Alert,
	FlatList,
	RefreshControl,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {useEffect, useState} from "react";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {helper} from "../../redux/store";
import {RootNav} from "../../components/Root";
import {LibRoomBookRecord} from "thu-info-lib/dist/models/home/library";
import themes from "../../assets/themes/themes";
import {CabError} from "thu-info-lib/dist/utils/error";

export const LibRoomBookRecordScreen = ({
	navigation,
}: {
	navigation: RootNav;
}) => {
	const [record, setRecord] = useState<LibRoomBookRecord[]>([]);
	const [refreshing, setRefreshing] = useState(false);

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	const refresh = () => {
		setRefreshing(true);
		helper
			.getLibraryRoomBookingRecord()
			.then(setRecord)
			.catch((e) => {
				if (e instanceof CabError) {
					navigation.navigate("LibRoomCaptcha");
				} else {
					Snackbar.show({
						text: getStr("networkRetry") + e?.message,
						duration: Snackbar.LENGTH_SHORT,
					});
				}
			})
			.then(() => setRefreshing(false));
	};
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(refresh, []);

	return (
		<FlatList
			style={{flex: 1}}
			data={record}
			refreshControl={
				<RefreshControl
					refreshing={refreshing}
					onRefresh={refresh}
					colors={[colors.accent]}
				/>
			}
			renderItem={({
				item: {
					regDate,
					over,
					status,
					name,
					category,
					owner,
					members,
					begin,
					end,
					description,
					rsvId,
				},
			}) => (
				<View
					style={{
						padding: 15,
						flexDirection: "row",
						justifyContent: "space-between",
					}}>
					<View style={{flex: 2, alignItems: "flex-start"}}>
						<Text style={{fontSize: 16, marginVertical: 2, color: colors.text}}>
							{name}
						</Text>
						<Text style={{color: "grey", marginVertical: 2}}>{category}</Text>
						<Text style={{color: "grey", marginVertical: 2}}>{owner}</Text>
						<Text style={{color: "grey", marginVertical: 2}}>{members}</Text>
						<Text style={{color: "grey", marginVertical: 2}}>
							{begin} - {end}
						</Text>
						<Text style={{color: "grey", marginVertical: 2}}>
							{getStr(over ? "isOver" : "notOver")}
						</Text>
						<Text style={{color: "grey", marginVertical: 2}}>
							{description}
						</Text>
						<Text style={{color: "grey", marginVertical: 2}}>{regDate}</Text>
					</View>
					<View style={{flex: 1, alignItems: "flex-end"}}>
						<Text style={{fontSize: 16, color: colors.text}}>{status}</Text>
						{rsvId !== undefined && (
							<TouchableOpacity
								style={{padding: 3}}
								onPress={() =>
									Alert.alert(
										getStr("confirmCancelBooking"),
										name,
										[
											{text: getStr("cancel")},
											{
												text: getStr("confirm"),
												onPress: () => {
													helper
														.cancelLibraryRoomBooking(rsvId)
														.then(({msg}) =>
															Snackbar.show({
																text: msg,
																duration: Snackbar.LENGTH_SHORT,
															}),
														)
														.catch((e) => {
															if (e instanceof CabError) {
																navigation.navigate("LibRoomCaptcha");
															} else {
																Snackbar.show({
																	text:
																		typeof e.message === "string"
																			? e.message
																			: getStr("networkRetry"),
																	duration: Snackbar.LENGTH_SHORT,
																});
															}
														})
														.then(refresh);
												},
											},
										],
										{cancelable: true},
									)
								}>
								{!helper.mocked() && (
									<Text style={{color: "red"}}>{getStr("cancelBooking")}</Text>
								)}
							</TouchableOpacity>
						)}
					</View>
				</View>
			)}
			keyExtractor={({begin, end, rsvId}) => begin + end + rsvId}
		/>
	);
};
