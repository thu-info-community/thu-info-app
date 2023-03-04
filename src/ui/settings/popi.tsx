import {Text, View} from "react-native";
import {simpleRefreshListScreen} from "../../components/settings/simpleRefreshListScreen";
import {helper} from "../../redux/store";
import {Feedback} from "thu-info-lib/dist/models/app/feedback";

export const PopiScreen = simpleRefreshListScreen<Feedback>(
	async () => await helper.getFeedbackReplies(),
	({content, reply}, _, __, {colors}) => (
		<View style={{padding: 15, marginVertical: 5}}>
			<Text
				style={{
					marginBottom: 5,
					fontWeight: "bold",
					fontSize: 16,
					lineHeight: 18,
					color: colors.text,
				}}>
				{"Q: " + content}
			</Text>
			<View style={{backgroundColor: "grey", height: 1}} />
			<Text style={{marginTop: 10, lineHeight: 17, color: colors.text}}>
				{"A: " + reply}
			</Text>
		</View>
	),
	({content}) => content,
);
