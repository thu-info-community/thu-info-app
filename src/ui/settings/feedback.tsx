import {
	GestureResponderEvent,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import React, {useState} from "react";
import zh from "../../assets/translations/zh";
import {getStr} from "../../utils/i18n";
import {SettingsNav} from "./settingsStack";
import {submitFeedback} from "../../utils/leanCloud";
import Snackbar from "react-native-snackbar";

const BottomButton = ({
	text,
	onPress,
}: {
	text: keyof typeof zh;
	onPress: (event: GestureResponderEvent) => void;
}) => (
	<TouchableOpacity
		style={{backgroundColor: "#0002", flex: 1, margin: 4}}
		onPress={onPress}>
		<Text style={{textAlign: "center", padding: 10}}>{getStr(text)}</Text>
	</TouchableOpacity>
);

export const FeedbackScreen = ({navigation}: {navigation: SettingsNav}) => {
	const [text, setText] = useState("");
	return (
		<View style={{flex: 1}}>
			<TextInput
				value={text}
				onChangeText={setText}
				style={{
					flex: 1,
					textAlignVertical: "top",
					fontSize: 15,
					margin: 8,
					padding: 10,
					backgroundColor: "#FFF",
				}}
				placeholder={getStr("feedbackHint")}
				multiline={true}
			/>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-around",
					padding: 5,
				}}>
				<BottomButton text="popi" onPress={() => navigation.navigate("Popi")} />
				<BottomButton
					text="submit"
					onPress={() => {
						submitFeedback(text)
							.then(() =>
								Snackbar.show({
									text: getStr("feedbackSuccess"),
									duration: Snackbar.LENGTH_SHORT,
								}),
							)
							.catch(() =>
								Snackbar.show({
									text: getStr("networkRetry"),
									duration: Snackbar.LENGTH_SHORT,
								}),
							);
					}}
				/>
			</View>
		</View>
	);
};
