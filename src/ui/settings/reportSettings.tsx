import {SettingsSwitch} from "../../components/settings/items";
import {getStr} from "../../utils/i18n";
import React from "react";
import {currState, store} from "../../redux/store";
import {SET_BX, SET_NEW_GPA} from "../../redux/constants";

export const ReportSettingsScreen = () => (
	<>
		<SettingsSwitch
			textOn={getStr("newGPA")}
			textOff={getStr("oldGPA")}
			onValueChange={(state) => {
				store.dispatch({type: SET_NEW_GPA, payload: state});
			}}
			defaultValue={currState().config.newGPA}
		/>
		<SettingsSwitch
			textOn={getStr("bx")}
			textOff={getStr("bxr")}
			onValueChange={(state) => {
				store.dispatch({type: SET_BX, payload: state});
			}}
			defaultValue={currState().config.bx}
		/>
	</>
);
