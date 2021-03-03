import React, {useState} from "react";
import {
	TouchableWithoutFeedback,
	Text,
	TextInput,
	TouchableOpacity,
	View,
	Keyboard,
} from "react-native";
import {getStr} from "../../utils/i18n";
import {postNewHole} from "../../network/hole";
import {HomeNav} from "./homeStack";
import {NetworkRetry} from "../../components/easySnackbars";
import Snackbar from "react-native-snackbar";
import {useColorScheme} from "react-native-appearance";
import themes from "../../assets/themes/themes";
import {launchImageLibrary} from "react-native-image-picker";

export const HolePublishScreen = ({navigation}: {navigation: HomeNav}) => {
	const themeName = useColorScheme();
	const {colors} = themes[themeName];
	const [text, setText] = useState("");
	const [base64, setBase64] = useState<string | undefined>();

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
			<View style={{flex: 1, paddingHorizontal: 20, paddingTop: 20}}>
				<TextInput
					value={text}
					onChangeText={setText}
					style={{
						flex: 1,
						textAlignVertical: "top",
						fontSize: 15,
						margin: 8,
						padding: 10,
						backgroundColor: colors.background,
						color: colors.text,
						borderColor: "#CCC",
						borderWidth: 1,
						borderRadius: 5,
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
							if (base64) {
								setBase64(undefined);
							} else {
								launchImageLibrary(
									{mediaType: "photo", includeBase64: true},
									(response) => {
										setBase64(response.base64);
									},
								);
							}
						}}>
						<Text
							style={{textAlign: "center", padding: 10, color: colors.text}}>
							{getStr(base64 ? "removeImage" : "addImage")}
						</Text>
					</TouchableOpacity>
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
							postNewHole(text, base64)
								.then(() => navigation.pop())
								.catch(NetworkRetry);
						}}>
						<Text
							style={{textAlign: "center", padding: 10, color: colors.text}}>
							{getStr("publish")}
						</Text>
					</TouchableOpacity>
				</View>
			</View>
		</TouchableWithoutFeedback>
	);
};
