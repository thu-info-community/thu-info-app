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

export const SettingsScreen = ({navigation}: {navigation: SettingsNav}) => (
	<ScrollView>
		<SettingsSwitch
			textOn={getStr("graduate")}
			textOff={getStr("undergraduate")}
			onValueChange={(state) =>
				store.dispatch({type: SET_GRADUATE, payload: state})
			}
			defaultValue={currState().config.graduate}
		/>
		<SettingsItem
			text={getStr("reportSettings")}
			onPress={() => navigation.navigate("ReportSettings")}
		/>
		<SettingsItem
			text={getStr("scheduleSettings")}
			onPress={() => navigation.navigate("ScheduleSettings")}
		/>
		<SettingsSeparator />
		<SettingsItem
			text={getStr("eleRecord")}
			onPress={() => navigation.navigate("EleRecord")}
		/>
		<SettingsItem
			text={getStr("libBookRecord")}
			onPress={() => navigation.navigate("LibBookRecord")}
		/>
		<SettingsSeparator />
		<SettingsItem
			text={getStr("checkUpdate")}
			onPress={() => checkUpdate(true)}
		/>
		<SettingsSeparator />
		<SettingsItem
			text={getStr("feedback")}
			onPress={() => navigation.navigate("Feedback")}
		/>
		<SettingsItem
			text={getStr("acknowledgements")}
			onPress={() => navigation.navigate("Acknowledgements")}
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
		/>
	</ScrollView>
);
