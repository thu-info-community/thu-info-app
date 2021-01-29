import React from "react";
import {Text, View} from "react-native";
import {retrieve} from "../../network/core";
import {POPI_URL} from "../../constants/strings";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";

export const PopiScreen = simpleRefreshListScreen<[string, string]>(
	() => retrieve(POPI_URL).then(JSON.parse),
	([q, a], _, __, {colors}) => (
		<View style={{padding: 15, marginVertical: 5}}>
			<Text
				style={{
					marginBottom: 5,
					fontWeight: "bold",
					fontSize: 16,
					lineHeight: 18,
					color: colors.text,
				}}>
				{"Q: " + q}
			</Text>
			<View style={{backgroundColor: "grey", height: 1}} />
			<Text style={{marginTop: 10, lineHeight: 17, color: colors.text}}>
				{"A: " + a}
			</Text>
		</View>
	),
	([x]) => x,
);
