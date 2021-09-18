import {Alert, Text, TouchableOpacity, View} from "react-native";
import React from "react";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {helper} from "../../redux/store";

export const LibRoomBookRecordScreen = simpleRefreshListScreen(
	helper.getLibraryRoomBookingRecord,
	(
		{
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
		refresh,
		_,
		{colors},
	) => {
		return (
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
					<Text style={{color: "grey", marginVertical: 2}}>{description}</Text>
					<Text style={{color: "grey", marginVertical: 2}}>{regDate}</Text>
				</View>
				<View style={{flex: 1, alignItems: "flex-end"}}>
					<Text style={{fontSize: 16, color: colors.text}}>{status}</Text>
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
													Snackbar.show({
														text:
															typeof e === "string"
																? e
																: getStr("networkRetry"),
														duration: Snackbar.LENGTH_SHORT,
													});
												})
												.then(refresh);
										},
									},
								],
								{cancelable: true},
							)
						}>
						<Text style={{color: "red"}}>{getStr("cancelBooking")}</Text>
					</TouchableOpacity>
				</View>
			</View>
		);
	},
	({rsvId}) => rsvId,
);
