import React from "react";
import {Text, View} from "react-native";
import {retrieve} from "../../network/core";
import {POPI_URL} from "../../constants/strings";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";

export const PopiScreen = simpleRefreshListScreen<[string, string]>(
	() => retrieve(POPI_URL).then(JSON.parse),
	([q, a]) => (
		<View style={{padding: 10, marginVertical: 15}}>
			<Text
				style={{
					marginBottom: 5,
					fontWeight: "bold",
					fontSize: 16,
					lineHeight: 18,
				}}>
				{"Q: " + q}
			</Text>
			<View style={{backgroundColor: "grey", height: 1}} />
			<Text style={{marginTop: 10, lineHeight: 17}}>{"A: " + a}</Text>
		</View>
	),
	([x]) => x,
);
