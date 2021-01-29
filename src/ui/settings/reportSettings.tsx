import {SettingsItem, SettingsSwitch} from "../../components/settings/items";
import {getStr} from "../../utils/i18n";
import React from "react";
import {currState, store} from "../../redux/store";
import {SET_BX, SET_NEW_GPA} from "../../redux/constants";
import {SettingsNav} from "./settingsStack";
import Feather from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import {View} from "react-native";

export const ReportSettingsScreen = ({
	navigation,
}: {
	navigation: SettingsNav;
}) => (
	<View style={{padding: 10}}>
		<SettingsSwitch
			textOn={getStr("newGPA")}
			textOff={getStr("oldGPA")}
			onValueChange={(state) => {
				store.dispatch({type: SET_NEW_GPA, payload: state});
			}}
			defaultValue={currState().config.newGPA}
			iconOn={<Feather name="file-plus" size={17} />}
			iconOff={<Feather name="file-minus" size={17} />}
		/>
		{currState().config.graduate || (
			<SettingsSwitch
				textOn={getStr("bx")}
				textOff={getStr("bxr")}
				onValueChange={(state) => {
					store.dispatch({type: SET_BX, payload: state});
				}}
				defaultValue={currState().config.bx}
				iconOn={<Feather name="filter" size={17} />}
				iconOff={<Feather name="filter" size={17} />}
			/>
		)}
		<SettingsItem
			text={getStr("manageHidden")}
			onPress={() => navigation.navigate("ReportManageHidden")}
			icon={<MaterialCommunityIcons name="file-hidden" size={17} />}
		/>
	</View>
);
