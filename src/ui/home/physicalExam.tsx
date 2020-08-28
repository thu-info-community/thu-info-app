import {Text, View} from "react-native";
import React from "react";
import {getPhysicalExamResult} from "../../network/basics";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";

export const PhysicalExamScreen = simpleRefreshListScreen(
	getPhysicalExamResult,
	([key, value]) => (
		<View style={{flexDirection: "row"}}>
			<Text style={{flex: 1, textAlign: "right", padding: 4}}>{key}</Text>
			<Text style={{flex: 1, textAlign: "left", padding: 4}}>{value}</Text>
		</View>
	),
	([x]) => x,
);
