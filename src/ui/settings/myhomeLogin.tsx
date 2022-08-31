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
			<View style={{flexDirection: "row", alignItems: "center"}}>
				<IconPerson width={18} height={18} />
				<TextInput
					style={style.textInputStyle}
					placeholder={getStr("userId")}
					placeholderTextColor={theme.colors.primary}
					selectionColor={theme.colors.accent}
					value={userId}
					editable={false}
				/>
			</View>
			<View style={{flexDirection: "row", alignItems: "center"}}>
				<IconLock width={18} height={18} />
				<TextInput
					style={style.textInputStyle}
					placeholder={getStr("password")}
					placeholderTextColor={theme.colors.primary}
					selectionColor={theme.colors.accent}
					value={password}
					onChangeText={setPassword}
					secureTextEntry
				/>
			</View>
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
				<Text style={style.loginButtonTextStyle}>{getStr("login")}</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = themedStyles((theme) => {
	return {
		container: {
			flex: 1,
			justifyContent: "center",
			alignItems: "center",
		},

		textInputStyle: {
			color: theme.colors.primary,
			width: "36%",
			textAlign: "left",
			marginHorizontal: 10,
			padding: 10,
		},

		loginButtonStyle: {
			height: 35,
			width: 100,
			backgroundColor: theme.colors.accent,
			marginTop: 30,
			marginBottom: 20,
			justifyContent: "center",
			alignItems: "center",
			borderRadius: 8,
		},

		loginButtonTextStyle: {
			color: "white",
			fontWeight: "bold",
		},

		credentialNoteStyle: {
			color: theme.colors.primaryDark,
			marginHorizontal: 40,
			marginTop: 20,
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
