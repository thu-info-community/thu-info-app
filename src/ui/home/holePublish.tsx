import React, {useState} from "react";
import {
	KeyboardAvoidingView,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import {getStr} from "../../utils/i18n";
import {postNewHole} from "../../network/hole";
import {HomeNav} from "./homeStack";
import {NetworkRetry} from "../../components/easySnackbars";
import Snackbar from "react-native-snackbar";

export const HolePublishScreen = ({navigation}: {navigation: HomeNav}) => {
	const [text, setText] = useState("");
	return (
		<KeyboardAvoidingView style={{flex: 1}}>
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
				placeholder={getStr("holePublishHint")}
				multiline={true}
			/>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-around",
					padding: 5,
				}}>
				<TouchableOpacity
					style={{
						backgroundColor: "#0002",
						flex: 1,
						margin: 4,
						borderRadius: 4,
					}}
					onPress={() => {
						Snackbar.show({
							text: getStr("processing"),
							duration: Snackbar.LENGTH_SHORT,
						});
						postNewHole(text)
							.then(() => navigation.pop())
							.catch(NetworkRetry);
					}}>
					<Text style={{textAlign: "center", padding: 10}}>
						{getStr("publish")}
					</Text>
				</TouchableOpacity>
			</View>
		</KeyboardAvoidingView>
	);
};
