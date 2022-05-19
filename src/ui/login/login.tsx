import {
	TextInput,
	View,
	Text,
	ActivityIndicator,
	Dimensions,
} from "react-native";
import React, {useEffect} from "react";
import {connect} from "react-redux";
import {currState, helper, State, store} from "../../redux/store";
import {LoginStatus} from "../../redux/states/auth";
import {setCalendarConfigAction} from "../../redux/actions/config";
import {getStr} from "../../utils/i18n";
import {TouchableOpacity} from "react-native-gesture-handler";
import {BlurView} from "@react-native-community/blur";
import themedStyles from "../../utils/themedStyles";
import themes from "../../assets/themes/themes";
import Icon from "react-native-vector-icons/FontAwesome";
import IconMain from "../../assets/icons/IconMain";
import {useColorScheme} from "react-native";
import {LoginNav} from "../../components/AuthFlow";
import {loginAction} from "../../redux/actions/auth";

interface LoginProps {
	readonly userId: string;
	readonly password: string;
	readonly status: LoginStatus;
	login: (userId: string, password: string) => void;
	loginSuccess: () => void;
	navigation: LoginNav;
}

const LoginUI = (props: LoginProps) => {
	const [userId, setUserId] = React.useState(props.userId);
	const [password, setPassword] = React.useState(props.password);

	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

	const performLogin = () => {
		props.login(userId, password);
	};

	useEffect(() => {
		if (props.userId !== "") {
			performLogin();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const width = Dimensions.get("window").width * 0.4;

	return (
		<View style={style.container}>
			<View style={style.absoluteContainer}>
				<View style={{height: 80}} />
				<IconMain width={width} height={width} />
				<View style={{height: 20}} />
				<View style={{flexDirection: "row", alignItems: "center"}}>
					<Icon name="user" size={18} color={theme.colors.primary} />
					<TextInput
						style={style.textInputStyle}
						placeholder={getStr("userId")}
						placeholderTextColor={theme.colors.primary}
						selectionColor={theme.colors.accent}
						value={userId}
						testID="loginUserId"
						onChangeText={setUserId}
						keyboardType={"numeric"}
					/>
				</View>
				<View style={{flexDirection: "row", alignItems: "center"}}>
					<Icon name="key" size={18} color={theme.colors.primary} />
					<TextInput
						style={style.textInputStyle}
						placeholder={getStr("password")}
						placeholderTextColor={theme.colors.primary}
						selectionColor={theme.colors.accent}
						value={password}
						testID="loginPassword"
						onChangeText={setPassword}
						secureTextEntry
					/>
				</View>
				<TouchableOpacity
					style={style.loginButtonStyle}
					testID="loginButton"
					onPress={() => {
						performLogin();
					}}>
					<Text style={style.loginButtonTextStyle}>{getStr("login")}</Text>
				</TouchableOpacity>
				<Text
					style={{
						color: theme.colors.primaryDark,
						fontSize: 21,
						marginTop: 70,
					}}>
					{getStr("slogan")}
				</Text>
				<TouchableOpacity
					onPress={() => props.navigation.navigate("HelpAndFeedback")}>
					<Text style={style.feedbackTextStyle}>{getStr("feedback")}</Text>
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

		feedbackTextStyle: {
			color: theme.colors.primary,
			marginTop: 60,
		},

		credentialNoteStyle: {
			color: theme.colors.primaryDark,
			marginHorizontal: 40,
			marginTop: 20,
		},

		loggingInCaptionStyle: {
			marginTop: 5,
			color: theme.colors.text,
		},
	};
});

export const LoginScreen = connect(
	(state: State) => state.auth,
	(dispatch) => {
		return {
			login: (userId: string, password: string) => {
				dispatch(loginAction.request({userId, password}));
				helper
					.login({
						userId,
						password,
						dormPassword: currState().credentials.dormPassword,
					})
					.then(() => {
						dispatch(loginAction.success());
						helper.getCalendar().then((c) => {
							store.dispatch(setCalendarConfigAction(c));
						});
					})
					.catch(() => {
						// Do nothing
					});
			},
		};
	},
)(LoginUI);
