import {TextInput, View, Text, TouchableOpacity} from "react-native";
import React from "react";
import {helper} from "../../redux/store";
import {getStr} from "../../utils/i18n";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import IconLock from "../../assets/icons/IconLock";
import {RootNav} from "../../components/Root";
import {NetworkRetry} from "../../components/easySnackbars";
import Snackbar from "react-native-snackbar";
import {RoundedView} from "../../components/views";
import {styles} from "./myhomeLogin";

export const ResetDormPasswordScreen = ({
	navigation,
}: {
	navigation: RootNav;
}) => {
	const [password, setPassword] = React.useState("");
	const [confirm, setConfirm] = React.useState("");
	const [processing, setProcessing] = React.useState(false);

	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

	return (
		<View style={style.container}>
			<RoundedView style={style.inputRounded}>
				<IconLock width={18} height={18} />
				<TextInput
					style={style.textInputStyle}
					placeholder={getStr("password")}
					placeholderTextColor={theme.colors.fontB3}
					value={password}
					onChangeText={setPassword}
					secureTextEntry
				/>
			</RoundedView>
			<RoundedView style={style.inputRounded}>
				<IconLock width={18} height={18} />
				<TextInput
					style={style.textInputStyle}
					placeholder={getStr("confirmPassword")}
					placeholderTextColor={theme.colors.fontB3}
					value={confirm}
					onChangeText={setConfirm}
					secureTextEntry
				/>
			</RoundedView>
			<TouchableOpacity
				style={style.loginButtonStyle}
				disabled={processing || password !== confirm || password.length === 0}
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
				}}>
				<RoundedView style={style.loginRounded}>
					<Text style={style.loginButtonTextStyle}>
						{getStr("resetPassword")}
					</Text>
				</RoundedView>
			</TouchableOpacity>
			<View style={{margin: 16, marginTop: 12}}>
				<Text style={{color: theme.colors.fontB3}}>
					{getStr("resetDormPasswordHint")}
				</Text>
			</View>
		</View>
	);
};
