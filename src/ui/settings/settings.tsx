import React from "react";
import {getStr} from "../../utils/i18n";
import {RootNav} from "../../components/Root";
import {helper, store} from "../../redux/store";
import {SettingsItem, SettingsSeparator} from "../../components/settings/items";
import {Alert, ScrollView} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import AntDesign from "react-native-vector-icons/AntDesign";
import Snackbar from "react-native-snackbar";
import {NetworkRetry} from "../../components/easySnackbars";
import {setDormPasswordAction} from "../../redux/actions/credentials";
import {scheduleClearAction} from "../../redux/actions/schedule";
import {configSet, setCalendarConfigAction} from "../../redux/actions/config";
import {doLogoutAction} from "../../redux/actions/auth";

export const SettingsScreen = ({navigation}: {navigation: RootNav}) => {
	return (
		<>
			<ScrollView style={{padding: 10}}>
				<SettingsItem
					text={getStr("scheduleSettings")}
					onPress={() => navigation.navigate("ScheduleSettings")}
					icon={<Feather name="layout" size={16} />}
				/>
				<SettingsSeparator />
				<SettingsItem
					text={getStr("helpAndFeedback")}
					onPress={() => navigation.navigate("HelpAndFeedback")}
					icon={<Feather name="edit" size={16} />}
				/>
				<SettingsItem
					text={getStr("about")}
					onPress={() => navigation.navigate("About")}
					icon={<AntDesign name="copyright" size={16} />}
				/>
				<SettingsSeparator />
				<SettingsItem
					text={getStr("forceLogin")}
					onPress={async () => {
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
					}}
					icon={<Feather name="refresh-cw" size={16} />}
				/>
				<SettingsItem
					text={getStr("logout")}
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
					}}
					icon={<Feather name="user-x" size={16} />}
				/>
			</ScrollView>
		</>
	);
};
