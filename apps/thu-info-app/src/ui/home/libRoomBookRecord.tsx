import {Alert, Text, TouchableOpacity, View} from "react-native";
import {getStr} from "../../utils/i18n";
import {Snackbar} from "react-native-snackbar";
import {helper} from "../../redux/store";
import dayjs from "dayjs";
import {NetworkRetry} from "../../components/easySnackbars";
import {roundedRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";

export const LibRoomBookRecordScreen = roundedRefreshListScreen(
	helper.getLibraryRoomBookingRecord,
	(
		{uuid, owner, date, begin, end, devName, kindName, members},
		refresh,
		_,
		{colors},
	) => (
		<View
			style={{
				padding: 15,
				flexDirection: "row",
				justifyContent: "space-between",
			}}>
			<View style={{flex: 2, alignItems: "flex-start"}}>
				<Text style={{fontSize: 16, marginVertical: 2, color: colors.text}}>
					{devName}
				</Text>
				<Text style={{color: "grey", marginVertical: 2}}>{kindName}</Text>
				<Text style={{color: "grey", marginVertical: 2}}>{owner}</Text>
				<Text style={{color: "grey", marginVertical: 2}}>
					{members.map(({name, userId}) => `${name}(${userId})`).join(", ")}
				</Text>
				<Text style={{color: "grey", marginVertical: 2}}>
					{dayjs(begin).format("HH:mm")} - {dayjs(end).format("HH:mm")}
				</Text>
				<Text style={{color: "grey", marginVertical: 2}}>{date}</Text>
			</View>
			<View style={{flex: 1, alignItems: "flex-end"}}>
				{uuid !== undefined && (
					<TouchableOpacity
						style={{padding: 3}}
						onPress={() =>
							Alert.alert(
								getStr("confirmCancelBooking"),
								devName,
								[
									{text: getStr("cancel")},
									{
										text: getStr("confirm"),
										onPress: () => {
											helper
												.cancelLibraryRoomBooking(uuid)
												.then(() =>
													Snackbar.show({
														text: getStr("success"),
														duration: Snackbar.LENGTH_SHORT,
													}),
												)
												.catch(NetworkRetry)
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
	),
	({uuid, rsvId}) => uuid + rsvId,
);
