import {TextInput, View, Text, TouchableOpacity} from "react-native";
import React from "react";
import {connect} from "react-redux";
import {helper, State} from "../../redux/store";
import {getStr} from "../../utils/i18n";
import themedStyles from "../../utils/themedStyles";
import themes from "../../assets/themes/themes";
import {useColorScheme} from "react-native";
import IconLock from "../../assets/icons/IconLock";
import IconPerson from "../../assets/icons/IconPerson";
import {setDormPasswordAction} from "../../redux/actions/credentials";
import {roam} from "thu-info-lib/dist/lib/core";
import {RootNav} from "../../components/Root";
import {NetworkRetry} from "../../components/easySnackbars";
import Snackbar from "react-native-snackbar";
import {DormAuthError} from "thu-info-lib/dist/utils/error";
import {RoundedView} from "../../components/views";

const MyhomeLoginUI = ({
	userId,
	navigation,
	setDormPassword,
}: {
	userId: string;
	navigation: RootNav;
	setDormPassword: (password: string) => any;
}) => {
	const [password, setPassword] = React.useState("");
	const [processing, setProcessing] = React.useState(false);

	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

	return (
		<View style={style.container}>
			<RoundedView style={style.inputRounded}>
				<IconPerson width={18} height={18} />
				<TextInput
					style={style.textInputStyle}
					placeholder={getStr("userId")}
					placeholderTextColor={theme.colors.fontB3}
					value={userId}
					editable={false}
				/>
			</RoundedView>
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
			<TouchableOpacity
				style={style.loginButtonStyle}
				disabled={processing}
				onPress={() => {
					setProcessing(true);
					Snackbar.show({
						text: getStr("processing"),
						duration: Snackbar.LENGTH_SHORT,
					});
					helper.dormPassword = password;
					helper
						.logout()
						.then(() => helper.login({}))
						.then(() => roam(helper, "myhome", ""))
						.then(() => setDormPassword(password))
						.then(() => navigation.pop())
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
				}}>
				<RoundedView style={style.loginRounded}>
					<Text style={style.loginButtonTextStyle}>{getStr("login")}</Text>
				</RoundedView>
			</TouchableOpacity>
		</View>
	);
};

const styles = themedStyles((theme) => {
	return {
		container: {
			flex: 1,
			padding: 12,
			justifyContent: "center",
			alignItems: "center",
		},

		inputRounded: {
			flexDirection: "row",
			alignItems: "center",
			paddingHorizontal: 16,
			paddingVertical: 12,
			marginVertical: 8,
		},

		textInputStyle: {
			color: theme.colors.text,
			flex: 1,
			textAlign: "left",
			marginLeft: 16,
			padding: 0,
		},

		loginButtonStyle: {
			flexDirection: "row",
			marginTop: 83,
			justifyContent: "center",
			alignItems: "center",
		},

		loginRounded: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
		},

		loginButtonTextStyle: {
			color: theme.colors.themePurple,
		},
	};
});

export const MyhomeLoginScreen = connect(
	(state: State) => state.auth,
	(dispatch) => ({
		setDormPassword: (password: string) =>
			dispatch(setDormPasswordAction(password)),
	}),
)(MyhomeLoginUI);
