import {KeyboardAvoidingScreen} from "../../components/keyboardAvoidingScreen";
import {
	TextInput,
	View,
	Text,
	ActivityIndicator,
	TouchableOpacity,
	Linking,
	Platform,
	ScrollView,
} from "react-native";
import {useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {currState, helper, State} from "../../redux/store";
import {getStr} from "../../utils/i18n";
import {BlurView} from "@react-native-community/blur";
import themedStyles from "../../utils/themedStyles";
import themes from "../../assets/themes/themes";
import IconLock from "../../assets/icons/IconLock";
import IconPerson from "../../assets/icons/IconPerson";
import IconMain from "../../assets/icons/IconMain";
import {useColorScheme} from "react-native";
import {RootNav} from "../../components/Root";
import {login, loginWithPasskey} from "../../redux/slices/auth";
import {
	setActiveLibBookRecord,
	setActiveSportsReservationRecord,
} from "../../redux/slices/reservation";
import {setCrTimetable} from "../../redux/slices/timetable";
import {configSet} from "../../redux/slices/config";
import {updateAnnouncements} from "../../redux/slices/announcement";
import {setBalance} from "../../redux/slices/campusCard";
import {gt} from "semver";
import VersionNumber from "react-native-version-number";
import {IdMaintenanceNotice} from "../../components/settings/idMaintenanceNotice";
import {PrimaryButton} from "../../components/subpage/buttons";

export const LoginScreen = ({navigation}: {navigation: RootNav}) => {
	const auth = useSelector((s: State) => s.auth);
	const dispatch = useDispatch();
	const localPasskeys = Object.values(auth.passkeys);

	const [userId, setUserId] = useState(auth.userId || (localPasskeys.length === 1 ? localPasskeys[0].userId : ""));
	const [password, setPassword] = useState(auth.password);
	const [processing, setProcessing] = useState(false);
	const credential = auth.passkeys[userId];

	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

	const doNotRemindSemver =
		useSelector((s: State) => s.config.doNotRemindSemver) ?? "0.0.0";
	const latestVersion =
		useSelector((s: State) => s.config.latestVersion) ?? "3.0.0";
	const privacy312 = useSelector((s: State) => s.config.privacy312);
	const haveNewerVersion =
		gt(latestVersion, VersionNumber.appVersion) &&
		gt(latestVersion, doNotRemindSemver);

	const performLogin = (usePasskey = !!credential && password === "", loginUserId = userId) => {
		if (processing) return;
		setProcessing(true);
		const loginCredential = auth.passkeys[loginUserId];
		helper
			.login(usePasskey && loginCredential ? {method: "passkey", credential: loginCredential} : {userId: loginUserId, password})
			.then(() => {
				if (loginCredential) dispatch(loginWithPasskey(loginCredential));
				else dispatch(login({userId: loginUserId, password}));
				setPassword("");
			})
			.then(() =>
				helper
					.switchLang(getStr("mark") === "CH" ? "zh" : "en")
					.catch(() => {}),
			)
			.then(() => {
				if (Platform.OS === "ios" || Platform.OS === "android") {
					helper
						.appStartUp(Platform.OS, currState().config.uuid, VersionNumber.appVersion)
						.then(
							({
								bookingRecords,
								sportsReservationRecords,
								crTimetable,
								balance,
								latestVersion: {versionName},
								latestAnnounces,
							}) => {
								dispatch(setActiveLibBookRecord(bookingRecords));
								dispatch(
									setActiveSportsReservationRecord(sportsReservationRecords),
								);
								dispatch(setCrTimetable(crTimetable));
								dispatch(
									configSet({
										key: "latestVersion",
										value: versionName,
									}),
								);
								dispatch(updateAnnouncements(latestAnnounces));
								dispatch(setBalance(balance));
							},
						);
				}
				setProcessing(false);
				navigation.pop();
			})
			.catch(() => {
				setProcessing(false);
			});
	};

	return (
		<KeyboardAvoidingScreen style={style.container}>
			<ScrollView
				style={{width: "100%"}}
				contentContainerStyle={{
					flexGrow: 1,
					justifyContent: "center",
					alignItems: "center",
					padding: 24,
				}}
				keyboardShouldPersistTaps="handled">
				<View style={{width: "100%", maxWidth: 400, alignItems: "center"}}>
					<IconMain width={108} height={108} />
					<View style={{height: 20}} />
					{!userId && localPasskeys.map((item) => <PrimaryButton
						key={item.credentialId}
						style={[style.loginButtonStyle, style.passkeyButtonStyle]} disabled={processing}
						numberOfLines={1} text={`${getStr("passkeyLogin")} · ${item.userId}`}
						onPress={() => { setUserId(item.userId); setPassword(""); performLogin(true, item.userId); }} />)}
					<View
						style={{width: "100%", flexDirection: "row", alignItems: "center"}}>
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
					<View
						style={{width: "100%", flexDirection: "row", alignItems: "center"}}>
						<IconLock width={18} height={18} />
						<TextInput
							style={style.textInputStyle}
							placeholder={getStr("password")}
							placeholderTextColor={theme.colors.primary}
							selectionColor={theme.colors.accent}
							value={password}
							testID="loginPassword"
							onChangeText={setPassword}
							onSubmitEditing={() => {
								performLogin();
							}}
							secureTextEntry
						/>
					</View>
					{credential && <PrimaryButton
						testID="passkeyLoginButton" text={getStr("passkeyLogin")}
						style={[style.loginButtonStyle, style.passkeyButtonStyle]} disabled={processing}
						onPress={() => performLogin(true)} />}
					<IdMaintenanceNotice
						forgotPassword
						style={{alignSelf: "flex-end", paddingVertical: 8}}
						testID="forgotPasswordButton">
						<Text style={{color: theme.colors.primary}}>
							{getStr("forgotPassword")}
						</Text>
					</IdMaintenanceNotice>
					{(!credential || password !== "") && (privacy312 === true ||
					Platform.OS === "android" ||
					Platform.OS === "ios" ? (
						<PrimaryButton
							style={style.loginButtonStyle}
							testID="loginButton"
							disabled={processing}
							text={getStr("login")}
							onPress={() => {
								performLogin();
							}}
						/>
					) : (
						<PrimaryButton
							style={style.loginButtonStyle}
							testID="loginButton"
							text={getStr("privacyPolicy")}
							onPress={() => navigation.navigate("Privacy")}
						/>
					))}
					<Text style={style.credentialNoteStyle}>
						{getStr(
							Platform.OS === "android" || Platform.OS === "ios"
								? "credentialNote"
								: "credentialNoteHarmony",
						)}
					</Text>
					<TouchableOpacity
						onPress={() => navigation.navigate("FeishuFeedback")}>
						<Text style={style.feedbackTextStyle}>
							{getStr("feishuFeedback")}
						</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => Linking.openURL("https://app.cs.tsinghua.edu.cn")}>
						<Text
							style={
								haveNewerVersion
									? style.newVersionStyle
									: style.websiteTextStyle
							}>
							{haveNewerVersion
								? getStr("newVersionAvailableClick")
								: "app.cs.tsinghua.edu.cn"}
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
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
		</KeyboardAvoidingScreen>
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

		textInputStyle: {
			color: theme.colors.primary,
			flex: 1,
			textAlign: "left",
			marginHorizontal: 10,
			padding: 10,
		},

		loginButtonStyle: {
			marginTop: 20,
			marginBottom: 20,
		},
		passkeyButtonStyle: {
			width: "100%",
		},

		feedbackTextStyle: {
			color: theme.colors.primary,
			marginTop: 24,
		},

		websiteTextStyle: {
			color: theme.colors.primary,
			marginTop: 20,
		},

		newVersionStyle: {
			color: theme.colors.accent,
			marginTop: 20,
		},

		credentialNoteStyle: {
			color: theme.colors.primary,
			marginHorizontal: 40,
		},

		loggingInCaptionStyle: {
			marginTop: 5,
			color: theme.colors.text,
		},
	};
});
