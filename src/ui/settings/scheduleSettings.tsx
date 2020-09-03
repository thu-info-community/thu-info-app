import {SettingsEditValue} from "../../components/settings/items";
import React from "react";
import {getStr} from "../../utils/i18n";
import {State} from "../../redux/store";
import {SET_SCHEDULE_HEIGHT} from "../../redux/constants";
import {connect} from "react-redux";

export const ScheduleSettingsUI = ({
	height,
	setHeight,
}: {
	height: number;
	setHeight: (newHeight: number) => void;
}) => (
	<>
		<SettingsEditValue
			text={getStr("scheduleUnitHeight")}
			value={height}
			onValueChange={setHeight}
		/>
	</>
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
