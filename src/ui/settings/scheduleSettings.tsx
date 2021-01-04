import {SettingsEditValue, SettingsItem} from "../../components/settings/items";
import React from "react";
import {getStr} from "../../utils/i18n";
import {helper, State} from "../../redux/store";
import {SET_SCHEDULE_HEIGHT} from "../../redux/constants";
import {connect} from "react-redux";
import {View} from "react-native";
import Feather from "react-native-vector-icons/Feather";
import {SettingsNav} from "./settingsStack";

export const ScheduleSettingsUI = ({
	height,
	setHeight,
	navigation,
}: {
	height: number;
	setHeight: (newHeight: number) => void;
	navigation: SettingsNav;
}) => (
	<View style={{padding: 10}}>
		<SettingsEditValue
			text={getStr("scheduleUnitHeight")}
			value={height}
			onValueChange={setHeight}
		/>
		{!helper.mocked() && (
			<SettingsItem
				text={getStr("secondarySchedule")}
				onPress={() => navigation.navigate("SecondarySettings")}
				icon={<Feather name="plus" size={16} />}
			/>
		)}
	</View>
);

export const ScheduleSettingsScreen = connect(
	(state: State) => ({
		height: state.config.scheduleHeight,
	}),
	(dispatch) => ({
		setHeight: (newValue: number) =>
			dispatch({type: SET_SCHEDULE_HEIGHT, payload: newValue}),
	}),
)(ScheduleSettingsUI);
