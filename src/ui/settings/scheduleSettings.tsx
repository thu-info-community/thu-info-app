import {SettingsEditValue} from "../../components/settings/items";
import React from "react";
import {getStr} from "../../utils/i18n";
import {State} from "../../redux/store";
import {configSet} from "../../redux/actions/config";
import {connect} from "react-redux";
import {View} from "react-native";
import {RootNav} from "../../components/Root";

export const ScheduleSettingsUI = ({
	height,
	setHeight,
}: {
	height: number;
	setHeight: (newHeight: number) => void;
	navigation: RootNav;
}) => (
	<View style={{padding: 10}}>
		<SettingsEditValue
			text={getStr("scheduleUnitHeight")}
			value={height}
			onValueChange={setHeight}
		/>
	</View>
);

export const ScheduleSettingsScreen = connect(
	(state: State) => ({
		height: state.config.scheduleHeight,
	}),
	(dispatch) => ({
		setHeight: (h: number) => dispatch(configSet("scheduleHeight", h)),
	}),
)(ScheduleSettingsUI);
