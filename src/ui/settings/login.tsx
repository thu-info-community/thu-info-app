import {
	TextInput,
	View,
	Text,
	ActivityIndicator,
	TouchableOpacity,
} from "react-native";
import {useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {helper, State} from "../../redux/store";
import {getStr} from "../../utils/i18n";
import {BlurView} from "@react-native-community/blur";
import themedStyles from "../../utils/themedStyles";
import themes from "../../assets/themes/themes";
import IconLock from "../../assets/icons/IconLock";
import IconPerson from "../../assets/icons/IconPerson";
import IconMain from "../../assets/icons/IconMain";
import {useColorScheme} from "react-native";
import {RootNav} from "../../components/Root";
import {login} from "../../redux/slices/auth";
import {
	setActiveLibBookRecord,
	setActiveSportsReservationRecord,
} from "../../redux/slices/reservation";
import {setCrTimetable} from "../../redux/slices/timetable";

export const LoginScreen = ({navigation}: {navigation: RootNav}) => {
	const auth = useSelector((s: State) => s.auth);
	const dispatch = useDispatch();

	const [userId, setUserId] = useState(auth.userId);
	const [password, setPassword] = useState(auth.password);
	const [processing, setProcessing] = useState(false);

	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

	const performLogin = () => {
		setProcessing(true);
		helper
			.login({userId, password})
			.then(() => {
				dispatch(login({userId, password}));
			})
			.then(() =>
				helper
					.switchLang(getStr("mark") === "CH" ? "zh" : "en")
					.catch(() => {}),
			)
			.then(() => {
				helper
					.appStartUp()
					.then(({bookingRecords, sportsReservationRecords, crTimetable}) => {
						dispatch(setActiveLibBookRecord(bookingRecords));
						dispatch(
							setActiveSportsReservationRecord(sportsReservationRecords),
						);
						dispatch(setCrTimetable(crTimetable));
					});
				setProcessing(false);
				navigation.pop();
			})
			.catch(() => {
				setProcessing(false);
			});
	};

	return (
		<View style={style.container}>
			<View style={style.absoluteContainer}>
				<View style={{height: 80}} />
				<IconMain width={108} height={108} />
				<View style={{height: 20}} />
				<View style={{flexDirection: "row", alignItems: "center"}}>
					<IconPerson width={18} height={18} />
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
					<IconLock width={18} height={18} />
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
					onPress={() => navigation.navigate("HelpAndFeedback")}>
					<Text style={style.feedbackTextStyle}>{getStr("feedback")}</Text>
				</TouchableOpacity>
				<Text style={style.credentialNoteStyle}>
					{getStr("credentialNote")}
				</Text>
			</View>
			{processing ? (
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
