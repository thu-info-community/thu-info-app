import {KeyboardAvoidingScreen} from "../../components/keyboardAvoidingScreen";
import {ScrollView, View, Text} from "react-native";
import {useState} from "react";
import {helper} from "../../redux/store";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import IconLock from "../../assets/icons/IconLock";
import {RootNav} from "../../components/Root";
import {NetworkRetry} from "../../components/easySnackbars";
import {Snackbar} from "react-native-snackbar";
import {RoundedView} from "../../components/views";
import {PrimaryButton} from "../../components/subpage/buttons";
import {ThemedTextInput} from "../../components/subpage/fields";
import {styles} from "./myhomeLogin";

export const ResetDormPasswordScreen = ({
	navigation,
}: {
	navigation: RootNav;
}) => {
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [processing, setProcessing] = useState(false);

	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

	return (
		<KeyboardAvoidingScreen style={{flex: 1}}>
			<ScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={style.container}>
				<View style={style.form}>
					<RoundedView style={style.inputRounded}>
						<IconLock width={18} height={18} />
						<ThemedTextInput
							style={style.textInputStyle}
							placeholder={getStr("password")}
							value={password}
							onChangeText={setPassword}
							secureTextEntry
						/>
					</RoundedView>
					<RoundedView style={style.inputRounded}>
						<IconLock width={18} height={18} />
						<ThemedTextInput
							style={style.textInputStyle}
							placeholder={getStr("confirmPassword")}
							value={confirm}
							onChangeText={setConfirm}
							secureTextEntry
						/>
					</RoundedView>
					<PrimaryButton
						style={style.loginButtonStyle}
						text={getStr("resetPassword")}
						disabled={
							processing || password !== confirm || password.length === 0
						}
						onPress={() => {
							setProcessing(true);
							Snackbar.show({
								text: getStr("processing"),
								duration: Snackbar.LENGTH_SHORT,
							});
							helper
								.resetDormPassword(password)
								.then(() => navigation.pop())
								.catch(NetworkRetry)
								.then(() => setProcessing(false));
						}}
					/>
					<View style={{margin: 16, marginTop: 12}}>
						<Text style={{color: theme.colors.fontB3}}>
							{getStr("resetDormPasswordHint")}
						</Text>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingScreen>
	);
};
