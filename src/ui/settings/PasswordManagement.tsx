import {SettingsSetPassword} from "../../components/settings/items";
import {getStr} from "../../utils/i18n";
import React from "react";
import {connect} from "react-redux";
import {SET_DORM_PASSWORD} from "../../redux/constants";
import {View} from "react-native";
import {helper} from "../../redux/store";

export const PasswordManagementUI = ({
	setDormPassword,
}: {
	setDormPassword: (newToken: string) => void;
}) => (
	<View style={{padding: 10}}>
		<SettingsSetPassword
			text={getStr("homePassword")}
			onValueChange={setDormPassword}
			validator={() =>
				new Promise((resolve) => {
					helper
						.getTicket(-1)
						.then(() => resolve(true))
						.catch(() => resolve(false));
				})
			}
		/>
	</View>
);

export const PasswordManagementScreen = connect(undefined, (dispatch) => ({
	setDormPassword: (password: string) =>
		dispatch({type: SET_DORM_PASSWORD, payload: password}),
}))(PasswordManagementUI);
