import {KeyboardAvoidingScreen} from "../../components/keyboardAvoidingScreen";
import {ScrollView, View} from "react-native";
import {useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {helper, State} from "../../redux/store";
import {getStr} from "../../utils/i18n";
import themedStyles from "../../utils/themedStyles";
import {useColorScheme} from "react-native";
import IconLock from "../../assets/icons/IconLock";
import IconPerson from "../../assets/icons/IconPerson";
import {setDormPassword} from "../../redux/slices/credentials";
import {RootNav} from "../../components/Root";
import {NetworkRetry} from "../../components/easySnackbars";
import {Snackbar} from "react-native-snackbar";
import {DormAuthError} from "@thu-info/lib/src/utils/error";
import {RoundedView} from "../../components/views";
import {PrimaryButton, SecondaryButton} from "../../components/subpage/buttons";
import {ThemedTextInput} from "../../components/subpage/fields";

export const MyhomeLoginScreen = ({navigation}: {navigation: RootNav}) => {
	const [password, setPassword] = useState("");
	const [processing, setProcessing] = useState(false);

	const themeName = useColorScheme();
	const style = styles(themeName);

	const userId = useSelector((s: State) => s.auth.userId);
	const dispatch = useDispatch();

	return (
		<KeyboardAvoidingScreen style={{flex: 1}}>
			<ScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={style.container}>
				<View style={style.form}>
					<RoundedView style={style.inputRounded}>
						<IconPerson width={18} height={18} />
						<ThemedTextInput
							style={style.textInputStyle}
							placeholder={getStr("userId")}
							value={userId}
							editable={false}
						/>
					</RoundedView>
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
					<PrimaryButton
						style={style.loginButtonStyle}
						text={getStr("login")}
						disabled={processing}
						onPress={() => {
							setProcessing(true);
							Snackbar.show({
								text: getStr("processing"),
								duration: Snackbar.LENGTH_SHORT,
							});
							helper
								.getDormScore(password)
								.then(() => {
									navigation.pop();
									dispatch(setDormPassword(password));
								})
								.catch((e) => {
									if (e instanceof DormAuthError) {
										Snackbar.show({
											text: getStr("wrongPassword"),
											duration: Snackbar.LENGTH_SHORT,
										});
									} else {
										NetworkRetry();
									}
								})
								.then(() => setProcessing(false));
						}}
					/>
					<SecondaryButton
						style={style.resetButtonStyle}
						text={getStr("resetPassword")}
						disabled={processing}
						onPress={() => navigation.navigate("ResetDormPassword")}
					/>
				</View>
			</ScrollView>
		</KeyboardAvoidingScreen>
	);
};

export const styles = themedStyles(() => {
	return {
		container: {
			flexGrow: 1,
			padding: 24,
			justifyContent: "center",
			alignItems: "center",
		},
		form: {width: "100%", maxWidth: 480},

		inputRounded: {
			flexDirection: "row",
			alignItems: "center",
			paddingHorizontal: 16,
			paddingVertical: 12,
			marginVertical: 8,
		},

		textInputStyle: {
			flex: 1,
			textAlign: "left",
			marginLeft: 16,
			padding: 0,
		},

		loginButtonStyle: {
			marginTop: 24,
		},

		resetButtonStyle: {
			marginTop: 12,
		},
	};
});
