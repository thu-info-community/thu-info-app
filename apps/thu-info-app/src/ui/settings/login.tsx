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
	Switch,
} from "react-native";
import {useRef, useState} from "react";
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
import {
	login,
	loginWithPasskey,
	requirePasskeyRenewal,
} from "../../redux/slices/auth";
import {needsPasskeyRenewal} from "../../redux/passkeyMigration";
import {
	setActiveLibBookRecord,
	setActiveSportsReservationRecord,
} from "../../redux/slices/reservation";
import {setCrTimetable} from "../../redux/slices/timetable";
import {updateAnnouncements} from "../../redux/slices/announcement";
import {setBalance} from "../../redux/slices/campusCard";
import VersionNumber from "react-native-version-number";
import {refreshLatestVersion, useHasAppUpdate} from "../../utils/checkUpdate";
import {IdMaintenanceNotice} from "../../components/settings/idMaintenanceNotice";
import {PrimaryButton} from "../../components/subpage/buttons";
import {passkeyAvailable} from "../../utils/passkeyNative";
import {PasskeySettings} from "../../components/settings/passkeySettings";
import {cleanupRetiredPasskeys} from "../../utils/passkey";

export const LoginScreen = ({navigation}: {navigation: RootNav}) => {
	const auth = useSelector((s: State) => s.auth);
	const dispatch = useDispatch();
	const localPasskeys = Object.values(auth.passkeys);

	const [userId, setUserId] = useState(
		auth.userId || (localPasskeys.length === 1 ? localPasskeys[0].userId : ""),
	);
	const [password, setPassword] = useState(auth.password);
	const [processing, setProcessing] = useState(false);
	const [enablePasskeyOnLogin, setEnablePasskeyOnLogin] = useState(true);
	const [settingUpPasskey, setSettingUpPasskey] = useState(false);
	const finishPasskeySetup = useRef<(() => void) | undefined>(undefined);
	const credential = auth.passkeys[userId];

	const themeName = useColorScheme();
	const theme = themes(themeName);
	const style = styles(themeName);

	const privacy312 = useSelector((s: State) => s.config.privacy312);
	const haveNewerVersion = useHasAppUpdate();

	const performLogin = (
		usePasskey = !!credential && password === "",
		loginUserId = userId,
	) => {
		if (processing) return;
		const loginCredential = auth.passkeys[loginUserId];
		if (
			usePasskey &&
			loginCredential &&
			needsPasskeyRenewal(auth, loginUserId)
		) {
			dispatch(requirePasskeyRenewal(loginUserId));
			return;
		}
		setProcessing(true);
		const renewAfterPassword =
			!!loginCredential && needsPasskeyRenewal(auth, loginUserId);
		helper
			.login(
				usePasskey && loginCredential
					? {method: "passkey", credential: loginCredential}
					: {userId: loginUserId, password},
			)
			.then(() => {
				if (usePasskey && loginCredential)
					dispatch(loginWithPasskey(loginCredential));
				else dispatch(login({userId: loginUserId, password}));
				setPassword("");
				if (renewAfterPassword) {
					dispatch(requirePasskeyRenewal(loginUserId));
					setProcessing(false);
					return;
				}
				if (
					passkeyAvailable &&
					enablePasskeyOnLogin &&
					!loginCredential &&
					loginUserId !== "8888"
				) {
					return new Promise<void>((resolve) => {
						finishPasskeySetup.current = resolve;
						setSettingUpPasskey(true);
					});
				}
			})
			.then(() =>
				renewAfterPassword
					? undefined
					: helper
							.switchLang(getStr("mark") === "CH" ? "zh" : "en")
							.catch(() => {}),
			)
			.then(async () => {
				if (renewAfterPassword) return;
				if (currState().auth?.retiredPasskeys?.length) await cleanupRetiredPasskeys().catch(() => undefined);
				const platform: string = Platform.OS;
				if (platform === "ios" || platform === "android" || platform === "harmony") {
					refreshLatestVersion();
					helper
						.appStartUp(currState().config.uuid, VersionNumber.appVersion)
						.then(
							({
								bookingRecords,
								sportsReservationRecords,
								crTimetable,
								balance,
								latestAnnounces,
							}) => {
								dispatch(setActiveLibBookRecord(bookingRecords));
								dispatch(
									setActiveSportsReservationRecord(sportsReservationRecords),
								);
								dispatch(setCrTimetable(crTimetable));
								dispatch(updateAnnouncements(latestAnnounces));
								dispatch(setBalance(balance));
							},
						)
						.catch(() => {
							// Leave cached startup data available when the request fails.
						});
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
					{!userId &&
						localPasskeys.map((item) => (
							<PrimaryButton
								key={item.credentialId}
								style={[style.loginButtonStyle, style.passkeyButtonStyle]}
								disabled={processing}
								text={`${getStr("passkeyLogin")} · ${item.userId}`}
								onPress={() => {
									setUserId(item.userId);
									setPassword("");
									performLogin(true, item.userId);
								}}
							/>
						))}
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
					{credential && (
						<PrimaryButton
							testID="passkeyLoginButton"
							text={getStr("passkeyLogin")}
							style={[style.loginButtonStyle, style.passkeyButtonStyle]}
							disabled={processing}
							onPress={() => performLogin(true)}
						/>
					)}
					<IdMaintenanceNotice
						forgotPassword
						style={{alignSelf: "flex-end", paddingVertical: 8}}
						testID="forgotPasswordButton">
						<Text style={{color: theme.colors.primary}}>
							{getStr("forgotPassword")}
						</Text>
					</IdMaintenanceNotice>
					{passkeyAvailable && !credential && userId !== "8888" && (
						<View style={{width: "100%", marginTop: 12}}>
							<View
								style={{
									flexDirection: "row",
									alignItems: "center",
									minHeight: 48,
								}}>
								<Text
									style={{flex: 1, color: theme.colors.text, marginRight: 16}}>
									{getStr("passkeyEnableOnLogin")}
								</Text>
								<Switch
									testID="enablePasskeyOnLogin"
									accessibilityLabel={getStr("passkeyEnableOnLogin")}
									value={enablePasskeyOnLogin}
									onValueChange={setEnablePasskeyOnLogin}
									disabled={processing}
								/>
							</View>
							<Text style={{color: theme.colors.text}}>
								{getStr("passkeyEnablePrompt")}
							</Text>
						</View>
					)}
					{(!credential || password !== "") &&
						(privacy312 === true ||
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
					<Text style={style.loggingInCaptionStyle}>
						{getStr(settingUpPasskey ? "passkeySettingUp" : "loggingIn")}
					</Text>
				</View>
			) : null}
			{settingUpPasskey && (
				<PasskeySettings
					navigation={navigation}
					setup={{
						mode: "automatic",
						onFinished: () => {
							setSettingUpPasskey(false);
							finishPasskeySetup.current?.();
							finishPasskeySetup.current = undefined;
						},
					}}
				/>
			)}
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
