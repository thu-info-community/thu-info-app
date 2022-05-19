import {
	SettingsDoubleText,
	SettingsItem,
} from "../../components/settings/items";
import React from "react";
import {getStr} from "../../utils/i18n";
import {State} from "../../redux/store";
import {connect} from "react-redux";
import {View} from "react-native";
import {RootNav} from "../../components/Root";
import {setDormPasswordAction} from "../../redux/actions/credentials";

export const AccountUI = ({
	userId,
	navigation,
}: {
	userId: string;
	navigation: RootNav;
	setDormPassword: (password: string) => any;
}) => (
	<View style={{padding: 10}}>
		<SettingsDoubleText
			textLeft={getStr("infoAccount")}
			textRight={userId}
			onPress={undefined}
			icon={undefined}
		/>
		<SettingsItem
			text={getStr("myhomeAccount")}
			onPress={() => navigation.navigate("MyhomeLogin")}
			icon={undefined}
		/>
	</View>
);

export const AccountScreen = connect(
	(state: State) => state.auth,
	(dispatch) => ({
		setDormPassword: (password: string) =>
			dispatch(setDormPasswordAction(password)),
	}),
)(AccountUI);
