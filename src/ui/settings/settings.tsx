import React, {useState} from "react";
import {getStr} from "../../utils/i18n";
import {SettingsNav} from "./settingsStack";
import {helper, store} from "../../redux/store";
import {SettingsItem, SettingsSeparator} from "../../components/settings/items";
import {
	Alert,
	Dimensions,
	Image,
	Modal,
	ScrollView,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import {checkUpdate} from "../../utils/checkUpdate";
import Feather from "react-native-vector-icons/Feather";
import AntDesign from "react-native-vector-icons/AntDesign";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import Snackbar from "react-native-snackbar";
import {NetworkRetry} from "../../components/easySnackbars";
import {setDormPasswordAction} from "../../redux/actions/credentials";
import {scheduleClearAction} from "../../redux/actions/schedule";
import {configSet, setCalendarConfigAction} from "../../redux/actions/config";
import {useColorScheme} from "react-native";
import themes from "../../assets/themes/themes";
import AV from "leancloud-storage";
import {doLogoutAction} from "../../redux/actions/auth";

export const SettingsScreen = ({navigation}: {navigation: SettingsNav}) => {
	const [showPopup, setShowPopup] = useState(false);
	const [url, setUrl] = useState("");

	const themeName = useColorScheme();
	const {colors} = themes(themeName);

	return (
		<>
			<ScrollView style={{padding: 10}}>
				<SettingsItem
					text={getStr("scheduleSettings")}
					onPress={() => navigation.navigate("ScheduleSettings")}
					icon={<Feather name="layout" size={16} />}
				/>
				<SettingsSeparator />
				{!helper.mocked() && (
					<>
						<SettingsItem
							text={getStr("passwordManagement")}
							onPress={() => navigation.navigate("PasswordManagement")}
							icon={<FontAwesome name="lock" size={16} />}
						/>
						<SettingsSeparator />
					</>
				)}
				<SettingsItem
					text={getStr("checkUpdate")}
					onPress={() => checkUpdate(true)}
					icon={<Feather name="download" size={16} />}
				/>
				<SettingsSeparator />
				<SettingsItem
					text={getStr("feedback")}
					onPress={() => navigation.navigate("Feedback")}
					icon={<Feather name="edit" size={16} />}
				/>
				<SettingsItem
					text={getStr("about")}
					onPress={() => navigation.navigate("About")}
					icon={<AntDesign name="copyright" size={16} />}
				/>
				{!helper.mocked() && (
					<SettingsItem
						text={getStr("wechatGroup")}
						onPress={() => {
							new AV.Query("_File")
								.equalTo("name", "wechat.jpg")
								.first()
								.then((r) => setUrl(r?.get("url")))
								.then(() => setShowPopup(true));
						}}
						icon={<FontAwesome name="wechat" size={16} />}
					/>
				)}
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
								text: getStr("confirm"),
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
			<Modal
				animationType="fade"
				transparent={true}
				visible={showPopup}
				onRequestClose={() => setShowPopup(false)}>
				<View style={{flex: 1, alignSelf: "center", justifyContent: "center"}}>
					<View style={{backgroundColor: colors.background}}>
						<Image
							source={{uri: url}}
							style={{
								height: Dimensions.get("window").width * 0.7,
								width: Dimensions.get("window").width * 0.7,
							}}
							resizeMode="contain"
						/>
						<TouchableOpacity
							style={{padding: 8}}
							onPress={() => setShowPopup(false)}>
							<Text style={{color: "blue", textAlign: "center"}}>[CLOSE]</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</>
	);
};
