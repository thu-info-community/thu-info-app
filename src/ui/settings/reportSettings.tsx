import {SettingsItem, SettingsSwitch} from "../../components/settings/items";
import {getStr} from "../../utils/i18n";
import React from "react";
import {currState, helper, store} from "../../redux/store";
import {configSet} from "../../redux/actions/config";
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
			onValueChange={(newGPA) => {
				store.dispatch(configSet("newGPA", newGPA));
			}}
			defaultValue={currState().config.newGPA}
			iconOn={<Feather name="file-plus" size={17} />}
			iconOff={<Feather name="file-minus" size={17} />}
		/>
		{helper.graduate() || (
			<SettingsSwitch
				textOn={getStr("bx")}
				textOff={getStr("bxr")}
				onValueChange={(bx) => {
					store.dispatch(configSet("bx", bx));
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
