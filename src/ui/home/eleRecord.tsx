import {Text, View} from "react-native";
import React from "react";
import {roundedRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import {helper} from "../../redux/store";

export const EleRecordScreen = roundedRefreshListScreen(
	helper.getElePayRecord,
	(
		[_name, _id, time, _channel, value, status],
		_,
		__,
		{colors},
		index,
		total,
	) => {
		return (
			<View
				style={{
					marginTop: index === 0 ? 0 : 12,
					marginBottom: index === total - 1 ? 0 : 12,
					flexDirection: "row",
					justifyContent: "space-between",
				}}>
				<View style={{flex: 2, alignItems: "flex-start"}}>
					<Text style={{fontSize: 16, marginBottom: 3, color: colors.text}}>
						{status}
					</Text>
					<Text style={{color: "grey"}}>{time}</Text>
				</View>
				<View style={{flex: 1, alignItems: "flex-end"}}>
					<Text style={{fontSize: 20, color: colors.text}}>{value}</Text>
				</View>
			</View>
		);
	},
	(item) => item[1],
);
