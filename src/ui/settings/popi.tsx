import React from "react";
import {Text, View} from "react-native";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import {getFeedbackReplies} from "../../utils/webApi";

export const PopiScreen = simpleRefreshListScreen<{
	question: string;
	answer: string;
}>(
	async () => await getFeedbackReplies(),
	({question, answer}, _, __, {colors}) => (
		<View style={{padding: 15, marginVertical: 5}}>
			<Text
				style={{
					marginBottom: 5,
					fontWeight: "bold",
					fontSize: 16,
					lineHeight: 18,
					color: colors.text,
				}}>
				{"Q: " + question}
			</Text>
			<View style={{backgroundColor: "grey", height: 1}} />
			<Text style={{marginTop: 10, lineHeight: 17, color: colors.text}}>
				{"A: " + answer}
			</Text>
		</View>
	),
	({question}) => question,
);
