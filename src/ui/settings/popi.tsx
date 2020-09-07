import React from "react";
import {Text, View} from "react-native";
import {retrieve} from "../../network/core";
import {POPI_URL} from "../../constants/strings";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";

export const PopiScreen = simpleRefreshListScreen<[string, string]>(
	() => retrieve(POPI_URL).then(JSON.parse),
	([q, a]) => (
		<View style={{padding: 10}}>
			<Text>{q}</Text>
			<View style={{backgroundColor: "grey", height: 1}} />
			<Text>{a}</Text>
		</View>
	),
	([x]) => x,
);
