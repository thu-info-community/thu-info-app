import {Alert, Text, TouchableOpacity, View} from "react-native";
import React from "react";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";
import {helper} from "../../redux/store";

export const LibBookRecordScreen = simpleRefreshListScreen(
	helper.getBookingRecords,
	({pos, time, status, delId}, refresh, _, {colors}) => {
		const [lib, seat] = pos.split(":");
		return (
			<View
				style={{
					padding: 15,
					flexDirection: "row",
					justifyContent: "space-between",
				}}>
				<View style={{flex: 2, alignItems: "flex-start"}}>
					<Text style={{fontSize: 16, marginVertical: 2, color: colors.text}}>
						{lib}
					</Text>
					<Text style={{color: "grey", marginVertical: 2}}>{seat}</Text>
					<Text style={{color: "grey", marginVertical: 2}}>{time}</Text>
				</View>
				<View style={{flex: 1, alignItems: "flex-end"}}>
					<Text style={{fontSize: 16, color: colors.text}}>{status}</Text>
					{delId && (
						<TouchableOpacity
							style={{padding: 3}}
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
					)}
				</View>
			</View>
		);
	},
	({id}) => id,
);
