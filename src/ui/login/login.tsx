import {
	StyleSheet,
	Switch,
	TextInput,
	View,
	Text,
	Image,
	ActivityIndicator,
} from "react-native";
import React, {useEffect} from "react";
import {connect} from "react-redux";
import {authThunk} from "../../redux/actions/auth";
import {State} from "../../redux/store";
import {LoginStatus} from "../../redux/states/auth";
import {LOGIN_FAILURE} from "../../redux/constants";
import {getStr} from "../../utils/i18n";
import {TouchableOpacity} from "react-native-gesture-handler";
import Snackbar from "react-native-snackbar";

interface LoginProps {
	readonly userId: string;
	readonly password: string;
	readonly remember: boolean;
	readonly status: LoginStatus;
	login: (userId: string, password: string, remember: boolean) => void;
	resetStatus: () => void;
}

// Not That Ugly UI
const LoginUI = (props: LoginProps) => {
	const [userId, setUserId] = React.useState(props.userId);
	const [password, setPassword] = React.useState(props.password);
	const [remember, setRemember] = React.useState(props.remember);
	const [autoLoginLock, setAutoLoginLock] = React.useState(false);

	useEffect(() => {
		if (!autoLoginLock) {
			setAutoLoginLock(true);
			if (remember) {
				props.login(userId, password, remember);
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [autoLoginLock]);

	useEffect(() => {
		if (props.status === LoginStatus.Failed) {
			Snackbar.show({
				text: getStr("loginFailure"),
				duration: Snackbar.LENGTH_LONG,
			});
		}
	}, [props.status]);

	return props.status !== LoginStatus.LoggingIn ? (
		<View style={styles.container}>
			<Image
				source={require("./../../assets/images/MaskedAppIcon.png")}
				style={styles.appIconStyle}
			/>
			<TextInput
				style={styles.textInputStyle}
				placeholder={getStr("userId")}
				value={userId}
				onChangeText={setUserId}
				keyboardType={"numeric"}
			/>
			<TextInput
				style={styles.textInputStyle}
				placeholder={getStr("password")}
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>
			<View style={styles.switchContainer}>
				<Text style={styles.switchCaptionStyle}>{getStr("autoLogin")}</Text>
				<Switch value={remember} onValueChange={setRemember} />
			</View>
			<TouchableOpacity
				style={styles.loginBottonStyle}
				onPress={() => props.login(userId, password, remember)}>
				<Text style={styles.loginButtonTextStyle}>{getStr("login")}</Text>
			</TouchableOpacity>
			<Text style={styles.credentialNoteStyle}>{getStr("credentialNote")}</Text>
		</View>
	) : (
		<View style={styles.container}>
			<ActivityIndicator size="large" color="#911c95" />
			<Text style={styles.loggingInCaptionStyle}>{getStr("loggingIn")}</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},

	appIconStyle: {
		marginBottom: 15,
		resizeMode: "contain",
		height: 140,
	},

	textInputStyle: {
		height: 38,
		backgroundColor: "white",
		marginBottom: 15,
		textAlign: "left",
		borderColor: "lightgrey",
		borderWidth: 1,
		borderRadius: 5,
		alignSelf: "stretch",
		marginHorizontal: 80,
		padding: 10,
	},

	switchContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingTop: 15,
	},

	switchCaptionStyle: {
		color: "#000000",
		paddingRight: 15,
	},

	loginBottonStyle: {
		height: 35,
		width: 100,
		backgroundColor: "#911c95",
		marginTop: 30,
		marginBottom: 20,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
	},

	loginButtonTextStyle: {
		color: "#ffffff",
		fontWeight: "bold",
	},

	credentialNoteStyle: {
		color: "darkgrey",
		marginHorizontal: 40,
		marginTop: 130,
	},

	loggingInCaptionStyle: {
		marginTop: 5,
	},
});

export const LoginScreen = connect(
	(state: State) => state.auth,
	(dispatch) => {
		return {
			login: (userId: string, password: string, remember: boolean) => {
				// @ts-ignore
				dispatch(authThunk(userId, password, remember));
			},
			resetStatus: () => {
				dispatch({
					type: LOGIN_FAILURE,
					payload: LoginStatus.None,
				});
			},
		};
	},
)(LoginUI);
