import {Button, StyleSheet, Switch, TextInput, View} from "react-native";
import React, {useEffect} from "react";
import {connect} from "react-redux";
import {authThunk} from "../../redux/actions/auth";
import {State} from "../../redux/store";
import {LoginStatus} from "../../redux/states/auth";
import {LOGIN_FAILURE} from "../../redux/constants";

interface LoginProps {
	userId: string;
	password: string;
	remember: boolean;
	status: LoginStatus;
	login: (userId: string, password: string, remember: boolean) => void;
	resetStatus: () => void;
}

// Ugly UI
const LoginUI = (props: LoginProps) => {
	const {userId: pUserId, password: pPassword, remember: pRemember} = props;

	const [userId, setUserId] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [remember, setRemember] = React.useState(false);
	const [fetchedStorage, setFetchedStorage] = React.useState(false);

	useEffect(() => {
		setUserId(pUserId);
	}, [pUserId]);

	useEffect(() => {
		setPassword(pPassword);
	}, [pPassword]);

	useEffect(() => {
		setRemember(pRemember);
	}, [pRemember]);

	useEffect(() => {
		if (!fetchedStorage) {
			setFetchedStorage(true);
			// store.dispatch(authThunk("foo", "bar", true));
		}
	}, [fetchedStorage]);

	return (
		<View style={styles.center}>
			<TextInput
				placeholder="学号"
				value={userId}
				onChangeText={setUserId}
				keyboardType={"numeric"}
			/>
			<TextInput
				placeholder="密码"
				value={password}
				onChangeText={setPassword}
				secureTextEntry
			/>
			<Switch value={remember} onValueChange={setRemember} />
			<Button
				title="登录"
				onPress={() => {
					props.login(userId, password, remember);
				}}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	center: {flex: 1, alignItems: "center", justifyContent: "center"},
});

export const LoginScreen = connect(
	(state: State) => state.auth,
	(dispatch) => {
		return {
			login: (userId: string, password: string, remember: boolean) => {
				// @ts-ignore
				dispatch(authThunk(userId, password, remember));
			},
			resetStatus: () => {
				dispatch({
					type: LOGIN_FAILURE,
					payload: LoginStatus.None,
				});
			},
		};
	},
)(LoginUI);
