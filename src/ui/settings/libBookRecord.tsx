import {Alert, Text, TouchableOpacity, View} from "react-native";
import React from "react";
import {cancelBooking, getBookingRecords} from "../../network/library";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import {getStr} from "../../utils/i18n";
import Snackbar from "react-native-snackbar";

export const LibBookRecordScreen = simpleRefreshListScreen(
	getBookingRecords,
	({pos, time, status, delId}, refresh) => {
		const [lib, seat] = pos.split(":");
		return (
			<View
				style={{
					padding: 10,
					flexDirection: "row",
					justifyContent: "space-between",
				}}>
				<View style={{flex: 2, alignItems: "flex-start"}}>
					<Text style={{fontSize: 16, marginVertical: 2}}>{lib}</Text>
					<Text style={{color: "grey", marginVertical: 2}}>{seat}</Text>
					<Text style={{color: "grey", marginVertical: 2}}>{time}</Text>
				</View>
				<View style={{flex: 1, alignItems: "flex-end"}}>
					<Text style={{fontSize: 16}}>{status}</Text>
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
												cancelBooking(delId)
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
