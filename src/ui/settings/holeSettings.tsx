import {
	SettingsEditText,
	SettingsEditValue,
} from "../../components/settings/items";
import {getStr} from "../../utils/i18n";
import React from "react";
import {connect} from "react-redux";
import {State} from "../../redux/store";
import {HOLE_SET_BLOCK_WORDS, HOLE_SET_TOKEN} from "../../redux/constants";
import {ScrollView} from "react-native";

export const HoleSettingsUI = ({
	token,
	blockWords,
	setToken,
	setBlockWords,
}: {
	token: string;
	blockWords: string[] | undefined;
	setToken: (newToken: string) => void;
	setBlockWords: (newToken: string) => void;
}) => (
	<ScrollView style={{padding: 10}}>
		<SettingsEditValue
			text={getStr("holeTokenSettings")}
			value={token}
			onValueChange={setToken}
		/>
		<SettingsEditText
			text={getStr("holeSetBlockWords")}
			value={blockWords ? blockWords.join("\n") : ""}
			onValueChange={setBlockWords}
			placeholder={getStr("holeSetBlockWordsDescription")}
		/>
	</ScrollView>
);

export const HoleSettingsScreen = connect(
	(state: State) => state.hole,
	(dispatch) => ({
		setToken: (newValue: string) =>
			dispatch({type: HOLE_SET_TOKEN, payload: newValue}),
		setBlockWords: (newValue: string) =>
			dispatch({type: HOLE_SET_BLOCK_WORDS, payload: newValue.split("\n")}),
	}),
)(HoleSettingsUI);
