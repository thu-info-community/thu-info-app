import {SettingsEditValue} from "../../components/settings/items";
import React, {useState} from "react";
import {getStr} from "../../utils/i18n";
import {SET_REMAINDER_SHIFT} from "../../redux/constants";
import {connect} from "react-redux";
import {Button, View} from "react-native";
import {getExpenditures} from "./../../network/basics";

export const RemainderSettingsUI = ({
	setRemainderShift,
}: {
	setRemainderShift: (newShift: number) => void;
}) => {
	const [shift, setShift] = useState(0);

	// console.log(shift);

	return (
		<View style={{padding: 10}}>
			<SettingsEditValue
				text={getStr("setNewRemainder")}
				value={shift}
				onValueChange={(val) => setShift(val)}
			/>
			<Button title="Confirm" onPress={() => setRemainderShift(shift)} />
		</View>
	);
};

export const RemainderSettingsScreen = connect(
	() => ({}),
	(dispatch) => ({
		setRemainderShift: async (newValue: number) => {
			let oldRemainder: number = (
				await getExpenditures(new Date(1900, 1, 1), new Date())
			)[3];
			return dispatch({
				type: SET_REMAINDER_SHIFT,
				payload: newValue - oldRemainder,
			});
		},
	}),
)(RemainderSettingsUI);
