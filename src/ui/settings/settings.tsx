import React, {useState} from "react";
import {getStr} from "../../utils/i18n";
import {RootNav} from "../../components/Root";
import {helper, store} from "../../redux/store";
import {
	Alert,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import Snackbar from "react-native-snackbar";
import {NetworkRetry} from "../../components/easySnackbars";
import {setDormPasswordAction} from "../../redux/actions/credentials";
import {scheduleClearAction} from "../../redux/actions/schedule";
import {configSet, setCalendarConfigAction} from "../../redux/actions/config";
import {doLogoutAction} from "../../redux/actions/auth";
import {RoundedView} from "../../components/views";
import themedStyles from "../../utils/themedStyles";
import IconRight from "../../assets/icons/IconRight";
import VersionNumber from "react-native-version-number";
import themes from "../../assets/themes/themes";
import {useSelector} from "react-redux";

export const SettingsScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const theme = themes(themeName);
	// @ts-ignore
	const dark = useSelector((s) => s.config.darkMode);
	const darkModeHook = dark || themeName === "dark";

	const [forceLoginDisabled, setForceLoginDisabled] = useState(false);
	return (
		<View style={{flex: 1, padding: 12}} key={darkModeHook}>
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
							{getStr("version")} {VersionNumber.appVersion}
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
							await helper.login({});
							helper.getCalendar().then((c) => {
								store.dispatch(setCalendarConfigAction(c));
							});
							Snackbar.show({
								text: getStr("success"),
								duration: Snackbar.LENGTH_SHORT,
							});
						} catch (e) {
							NetworkRetry();
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
									store.dispatch(doLogoutAction());
								},
							},
							{
								text: getStr("yes"),
								onPress: () => {
									helper
										.logout()
										.then(() => console.log("Successfully logged out."));
									store.dispatch(doLogoutAction());
									store.dispatch(setDormPasswordAction(""));
									store.dispatch(scheduleClearAction());
									store.dispatch(configSet("emailName", ""));
								},
							},
						]);
					}}>
					<Text
						style={[
							style.text,
							{textAlign: "center", flex: 1, color: theme.colors.statusWarning},
						]}>
						{getStr("logout")}
					</Text>
				</TouchableOpacity>
			</RoundedView>
			<View style={{height: 80}} />
		</View>
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
		borderWidth: 0.2,
		borderColor: colors.themeGrey,
		marginVertical: 12,
		marginHorizontal: 16,
	},
}));
