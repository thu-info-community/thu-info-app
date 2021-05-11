import {SettingsSetPassword} from "../../components/settings/items";
import {getStr} from "../../utils/i18n";
import React from "react";
import {connect} from "react-redux";
import {setDormPasswordAction} from "../../redux/actions/credentials";
import {View} from "react-native";
import {helper} from "../../redux/store";
import {changePasswordAction} from "../../redux/actions/auth";

export const PasswordManagementUI = ({
	setDormPassword,
	setInfoPassword,
}: {
	setDormPassword: (newToken: string) => void;
	setInfoPassword: (newPassword: string) => void;
}) => (
	<View style={{padding: 10}}>
		<SettingsSetPassword
			text={getStr("infoPassword")}
			onValueChange={setInfoPassword}
			validator={async (password) => {
				try {
					try {
						await helper.logout();
					} catch (e) {}
					await helper.login({password}, () => {});
					return true;
				} catch (e) {
					return false;
				}
			}}
		/>
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
		dispatch(setDormPasswordAction(password)),
	setInfoPassword: (password: string) =>
		dispatch(changePasswordAction(password)),
}))(PasswordManagementUI);
