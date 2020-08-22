import {TextInput, View, Text, Image, ActivityIndicator} from "react-native";
import React, {useContext, useEffect} from "react";
import {connect} from "react-redux";
import {authThunk} from "../../redux/actions/auth";
import {State} from "../../redux/store";
import {LoginStatus} from "../../redux/states/auth";
import {LOGIN_FAILURE} from "../../redux/constants";
import {getStr} from "../../utils/i18n";
import {TouchableOpacity} from "react-native-gesture-handler";
import Snackbar from "react-native-snackbar";
import {BlurView} from "@react-native-community/blur";
import themedStyles from "../../utils/themedStyles";
import {ThemeContext} from "../../assets/themes/context";
import themes from "../../assets/themes/themes";

interface LoginProps {
	readonly userId: string;
	readonly password: string;
	readonly status: LoginStatus;
	login: (userId: string, password: string) => void;
	resetStatus: () => void;
}

// Not That Ugly UI
const LoginUI = (props: LoginProps) => {
	const [userId, setUserId] = React.useState(props.userId);
	const [password, setPassword] = React.useState(props.password);

	const themeName = useContext(ThemeContext);
	const theme = themes[themeName];
	const style = styles(themeName);

	useEffect(() => {
		if (props.userId !== "") {
			props.login(userId, password);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (props.status === LoginStatus.Failed) {
			Snackbar.show({
				text: getStr("loginFailure"),
				duration: Snackbar.LENGTH_LONG,
			});
			props.resetStatus();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [props.status]);

	return (
		<View style={style.container}>
			<View style={style.absoluteContainer}>
				<Image
					source={require("./../../assets/images/MaskedAppIcon.png")}
					style={style.appIconStyle}
				/>
				<TextInput
					style={style.textInputStyle}
					placeholder={getStr("userId")}
					value={userId}
					onChangeText={setUserId}
					keyboardType={"numeric"}
				/>
				<TextInput
					style={style.textInputStyle}
					placeholder={getStr("password")}
					value={password}
					onChangeText={setPassword}
					secureTextEntry
				/>
				<TouchableOpacity
					style={style.loginButtonStyle}
					onPress={() => props.login(userId, password)}>
					<Text style={style.loginButtonTextStyle}>{getStr("login")}</Text>
				</TouchableOpacity>
				<Text style={style.credentialNoteStyle}>
					{getStr("credentialNote")}
				</Text>
			</View>
			{props.status === LoginStatus.LoggingIn ? (
				<View style={style.absoluteContainer}>
					<BlurView
						style={style.blurViewStyle}
						blurType="light"
						blurAmount={10}
					/>
					<ActivityIndicator size="large" color={theme.colors.primary} />
					<Text style={style.loggingInCaptionStyle}>{getStr("loggingIn")}</Text>
				</View>
			) : null}
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

		absoluteContainer: {
			position: "absolute",
			top: 0,
			left: 0,
			bottom: 0,
			right: 0,
			justifyContent: "center",
			alignItems: "center",
		},

		blurViewStyle: {
			position: "absolute",
			top: 0,
			left: 0,
			bottom: 0,
			right: 0,
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

		loginButtonStyle: {
			height: 35,
			width: 100,
			backgroundColor: theme.colors.primary,
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
			color: "darkgrey",
			marginHorizontal: 40,
			marginTop: 130,
		},

		loggingInCaptionStyle: {
			marginTop: 5,
		},
	};
});

export const LoginScreen = connect(
	(state: State) => state.auth,
	(dispatch) => {
		return {
			login: (userId: string, password: string) => {
				// @ts-ignore
				dispatch(authThunk(userId, password));
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
