import {SettingsEditValue} from "../../components/settings/items";
import {getStr} from "../../utils/i18n";
import React from "react";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {HOLE_SET_TOKEN} from "../../redux/constants";
import {View} from "react-native";

export const HoleSettingsUI = ({
	token,
	setToken,
}: {
	token: string;
	setToken: (newToken: string) => void;
}) => (
	<View style={{padding: 10}}>
		<SettingsEditValue
			text={getStr("holeTokenSettings")}
			value={token}
			onValueChange={setToken}
		/>
	</View>
);

export const HoleSettingsScreen = connect(
	(state: State) => ({
		token: state.hole.token,
	}),
	(dispatch) => ({
		setToken: (newValue: string) =>
			dispatch({type: HOLE_SET_TOKEN, payload: newValue}),
	}),
)(HoleSettingsUI);
