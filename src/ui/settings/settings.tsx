import React from "react";
import {getStr} from "../../utils/i18n";
import {SettingsNav} from "./settingsStack";
import {currState, store} from "../../redux/store";
import {SET_GRADUATE} from "../../redux/constants";
import {
	SettingsItem,
	SettingsSeparator,
	SettingsSwitch,
} from "../../components/settings/items";
import {Alert, ScrollView} from "react-native";
import {doLogout} from "../../redux/actions/auth";
import {checkUpdate} from "../../utils/checkUpdate";
import Feather from "react-native-vector-icons/Feather";
import AntDesign from "react-native-vector-icons/AntDesign";
import Entypo from "react-native-vector-icons/Entypo";
import FontAwesome from "react-native-vector-icons/FontAwesome";

export const SettingsScreen = ({navigation}: {navigation: SettingsNav}) => (
	<ScrollView style={{padding: 10}}>
		<SettingsSwitch
			textOn={getStr("graduate")}
			textOff={getStr("undergraduate")}
			onValueChange={(state) =>
				store.dispatch({type: SET_GRADUATE, payload: state})
			}
			defaultValue={currState().config.graduate}
			iconOn={<Entypo name="graduation-cap" size={16} />}
			iconOff={<Feather name="users" size={16} />}
		/>
		<SettingsItem
			text={getStr("reportSettings")}
			onPress={() => navigation.navigate("ReportSettings")}
			icon={<Feather name="file-text" size={16} />}
		/>
		<SettingsItem
			text={getStr("scheduleSettings")}
			onPress={() => navigation.navigate("ScheduleSettings")}
			icon={<Feather name="layout" size={16} />}
		/>
		<SettingsItem
			text={getStr("remainderSettings")}
			onPress={() => navigation.navigate("RemainderSettings")}
			icon={<AntDesign name="creditcard" size={16} />}
		/>
		<SettingsSeparator />
		<SettingsItem
			text={getStr("holeSettings")}
			onPress={() => navigation.navigate("HoleSettings")}
		/>
		<SettingsSeparator />
		<SettingsItem
			text={getStr("eleRecord")}
			onPress={() => navigation.navigate("EleRecord")}
			icon={<Feather name="zap" size={16} />}
		/>
		<SettingsItem
			text={getStr("libBookRecord")}
			onPress={() => navigation.navigate("LibBookRecord")}
			icon={<Feather name="book-open" size={16} />}
		/>
		<SettingsSeparator />
		<SettingsItem
			text={getStr("experimental")}
			onPress={() => navigation.navigate("Experimental")}
			icon={<FontAwesome name="flask" size={16} />}
		/>
		<SettingsSeparator />
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
			text={getStr("acknowledgements")}
			onPress={() => navigation.navigate("Acknowledgements")}
			icon={<Feather name="tag" size={16} />}
		/>
		<SettingsItem
			text={getStr("about")}
			onPress={() => navigation.navigate("About")}
			icon={<AntDesign name="copyright" size={16} />}
		/>
		<SettingsSeparator />
		<SettingsItem
			text={getStr("logout")}
			onPress={() => {
				Alert.alert(getStr("logout"), getStr("confirmLogout"), [
					{text: getStr("cancel")},
					{text: getStr("confirm"), onPress: doLogout},
				]);
			}}
			icon={<Feather name="user-x" size={16} />}
		/>
	</ScrollView>
);
