import {Text, View} from "react-native";
import React from "react";
import {getBookingRecords} from "../../network/library";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";

export const LibBookRecordScreen = simpleRefreshListScreen(
	getBookingRecords,
	({pos, time, status}) => {
		const [lib, seat] = pos.split(":");
		return (
			<View
				style={{
					padding: 10,
					flexDirection: "row",
					justifyContent: "space-between",
				}}>
				<View style={{flex: 2, alignItems: "flex-start"}}>
					<Text style={{fontSize: 16}}>{lib}</Text>
					<Text style={{color: "grey"}}>{seat}</Text>
					<Text style={{color: "grey"}}>{time}</Text>
				</View>
				<View style={{flex: 1, alignItems: "flex-end"}}>
					<Text style={{fontSize: 16}}>{status}</Text>
				</View>
			</View>
		);
	},
	({id}) => id,
);
