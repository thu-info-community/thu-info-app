import {Text, View} from "react-native";
import React from "react";
import {getElePayRecord} from "../../network/dorm";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import {getStr} from "../../utils/i18n";

export const EleRecordScreen = simpleRefreshListScreen(
	getElePayRecord,
	(item) => {
		// const [name, id, time, channel, value, status] = item;
		const time = item[2];
		const value = item[4];
		const status = item[5];
		return (
			<View
				style={{
					padding: 15,
					flexDirection: "row",
					justifyContent: "space-between",
				}}>
				<View style={{flex: 2, alignItems: "flex-start"}}>
					<Text style={{fontSize: 16, marginBottom: 3}}>{status}</Text>
					<Text style={{color: "grey"}}>{time}</Text>
				</View>
				<View style={{flex: 1, alignItems: "flex-end"}}>
					<Text style={{fontSize: 20}}>{value}</Text>
				</View>
			</View>
		);
	},
	(item) => item[1],
	<Text style={{padding: 10, marginTop: 10, textAlign: "center"}}>
		<Text style={{fontWeight: "bold", fontSize: 16}}>{getStr("tips")}</Text>
		<Text style={{color: "gray"}}>{getStr("eleRecordRestriction")}</Text>
	</Text>,
);
