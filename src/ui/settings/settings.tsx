import {useState} from "react";
import {getStr} from "../../utils/i18n";
import {RootNav} from "../../components/Root";
import {helper, State} from "../../redux/store";
import {
	Alert,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
	ScrollView,
} from "react-native";
import Snackbar from "react-native-snackbar";
import {setDormPassword} from "../../redux/slices/credentials";
import {scheduleClear} from "../../redux/slices/schedule";
import {logout} from "../../redux/slices/auth";
import {RoundedView} from "../../components/views";
import themedStyles from "../../utils/themedStyles";
import IconRight from "../../assets/icons/IconRight";
import VersionNumber from "react-native-version-number";
import themes from "../../assets/themes/themes";
import {useDispatch, useSelector} from "react-redux";
import {
	setActiveLibBookRecord,
	setActiveSportsReservationRecord,
} from "../../redux/slices/reservation";
import {gt, gte} from "semver";

export const SettingsScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const theme = themes(themeName);
	const dark = useSelector((s: State) => s.config.darkMode);
	const darkModeHook = dark || themeName === "dark";
	const {userId, password} = useSelector((s: State) => s.auth);
	const dispatch = useDispatch();

	const doNotRemindSemver =
		useSelector((s: State) => s.config.latestVersion) ?? "0.0.0";
	const latestVersion =
		useSelector((s: State) => s.config.latestVersion) ?? "3.0.0";
	const newVersionAvailable =
		gte(latestVersion, VersionNumber.appVersion) &&
		gt(latestVersion, doNotRemindSemver);

	const [forceLoginDisabled, setForceLoginDisabled] = useState(false);
	return (
		<ScrollView>
			<View style={{flex: 1, padding: 12}} key={String(darkModeHook)}>
				<RoundedView style={style.rounded}>
					<TouchableOpacity
						style={style.touchable}
						onPress={() => navigation.navigate("Account")}>
						<Text style={style.text}>{getStr("accountAndSecurity")}</Text>
						<IconRight height={20} width={20} />
					</TouchableOpacity>
				</RoundedView>
				<RoundedView style={style.rounded}>
					<TouchableOpacity
						style={style.touchable}
						onPress={() => navigation.navigate("FunctionManagement")}>
						<Text style={style.text}>{getStr("functionManagement")}</Text>
						<IconRight height={20} width={20} />
					</TouchableOpacity>
					<View style={style.separator} />
					<TouchableOpacity
						style={style.touchable}
						onPress={() => navigation.navigate("General")}>
						<Text style={style.text}>{getStr("general")}</Text>
						<IconRight height={20} width={20} />
					</TouchableOpacity>
				</RoundedView>
				<RoundedView style={style.rounded}>
					<TouchableOpacity
						style={style.touchable}
						onPress={() => navigation.navigate("ScheduleSettings")}>
						<Text style={style.text}>{getStr("schedule")}</Text>
						<IconRight height={20} width={20} />
					</TouchableOpacity>
				</RoundedView>
				<RoundedView style={style.rounded}>
					<TouchableOpacity
						style={style.touchable}
						onPress={() => navigation.navigate("Privacy")}>
						<Text style={style.text}>{getStr("privacy")}</Text>
						<IconRight height={20} width={20} />
					</TouchableOpacity>
					<View style={style.separator} />
					<TouchableOpacity
						style={style.touchable}
						onPress={() => navigation.navigate("HelpAndFeedback")}>
						<Text style={style.text}>{getStr("helpAndFeedback")}</Text>
						<IconRight height={20} width={20} />
					</TouchableOpacity>
					<View style={style.separator} />
					<TouchableOpacity
						style={style.touchable}
						onPress={() => navigation.navigate("About")}>
						<Text style={style.text}>{getStr("aboutApp")}</Text>
						<View style={{flexDirection: "row", alignItems: "center"}}>
							<Text style={style.version}>
								{getStr("version")}{" "}
								{newVersionAvailable
									? getStr("newVersionAvailable")
									: VersionNumber.appVersion + "-beta.5"}
							</Text>
							<IconRight height={20} width={20} />
						</View>
					</TouchableOpacity>
				</RoundedView>
				<View style={{flex: 1}} />
				<RoundedView style={style.rounded}>
					<TouchableOpacity
						style={style.touchable}
						onPress={async () => {
							setForceLoginDisabled(true);
							try {
								Snackbar.show({
									text: getStr("processing"),
									duration: Snackbar.LENGTH_SHORT,
								});
								try {
									await helper.logout();
								} catch (e) {}
								await helper.login({userId, password});
								Snackbar.show({
									text: getStr("success"),
									duration: Snackbar.LENGTH_SHORT,
								});
							} catch (e: any) {
								Snackbar.show({
									text: getStr("networkRetry") + e?.message,
									duration: Snackbar.LENGTH_SHORT,
								});
							}
							setForceLoginDisabled(false);
						}}
						disabled={forceLoginDisabled}>
						<Text style={[style.text, {textAlign: "center", flex: 1}]}>
							{getStr("forceLogin")}
						</Text>
					</TouchableOpacity>
				</RoundedView>
				<RoundedView style={style.rounded}>
					<TouchableOpacity
						style={style.touchable}
						onPress={() => {
							Alert.alert(getStr("logout"), getStr("confirmLogout"), [
								{text: getStr("cancel")},
								{
									text: getStr("no"),
									onPress: () => {
										helper
											.logout()
											.then(() => console.log("Successfully logged out."));
										dispatch(logout());
									},
								},
								{
									text: getStr("yes"),
									onPress: () => {
										helper.userId = "";
										helper.password = "";
										helper
											.logout()
											.then(() => console.log("Successfully logged out."));
										dispatch(logout());
										dispatch(setDormPassword(""));
										dispatch(scheduleClear());
										dispatch(setActiveLibBookRecord([]));
										dispatch(setActiveSportsReservationRecord([]));
									},
								},
							]);
						}}>
						<Text
							style={[
								style.text,
								{
									textAlign: "center",
									flex: 1,
									color: theme.colors.statusWarning,
								},
							]}>
							{getStr("logout")}
						</Text>
					</TouchableOpacity>
				</RoundedView>
				<View style={{height: 80}} />
			</View>
		</ScrollView>
	);
};

export const styles = themedStyles(({colors}) => ({
	rounded: {
		marginTop: 16,
	},
	touchable: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
	},
	text: {
		color: colors.text,
		fontSize: 16,
	},
	version: {
		color: colors.fontB3,
		fontSize: 16,
	},
	separator: {
		borderWidth: 0.4,
		borderColor: colors.themeGrey,
		marginVertical: 12,
		marginHorizontal: 16,
	},
}));
