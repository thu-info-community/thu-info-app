import React, {useState} from "react";
import {getStr} from "../../utils/i18n";
import {State, store} from "../../redux/store";
import {
	Alert,
	Switch,
	Text,
	TouchableOpacity,
	useColorScheme,
	View,
} from "react-native";
import {connect} from "react-redux";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";
import {styles} from "./settings";
import {RootNav} from "../../components/Root";
import {setAppSecretAction} from "../../redux/actions/credentials";
import IconRight from "../../assets/icons/IconRight";
import {clearAppSecretAction, configSet} from "../../redux/actions/config";
import ReactNativeBiometrics from "react-native-biometrics";
import Snackbar from "react-native-snackbar";

const rnBiometrics = new ReactNativeBiometrics();

const AppSecretUI = ({
	navigation,
	verifyPasswordBeforeEnterApp,
	verifyPasswordBeforeEnterReport,
	useBiometrics,
}: {
	navigation: RootNav;
	verifyPasswordBeforeEnterApp: boolean | undefined;
	verifyPasswordBeforeEnterReport: boolean | undefined;
	useBiometrics: boolean | undefined;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const {colors} = themes(themeName);

	const [enabled, setEnabled] = useState(true);

	const customizeText =
		verifyPasswordBeforeEnterReport === true
			? getStr("enter") + getStr("report") + getStr("when")
			: "";

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("appSecret")}</Text>
					<Switch
						thumbColor={enabled ? colors.primaryLight : undefined}
						trackColor={{true: colors.mainTheme}}
						value={enabled}
						onValueChange={() => {
							setEnabled(false);
							Alert.alert(
								getStr("confirmDisableAppSecretTitle"),
								getStr("confirmDisableAppSecretMessage"),
								[
									{
										text: getStr("cancel"),
										onPress: () => setEnabled(true),
									},
									{
										text: getStr("confirm"),
										onPress: () => {
											navigation.pop();
											store.dispatch(setAppSecretAction(undefined));
											store.dispatch(clearAppSecretAction());
										},
									},
								],
								{cancelable: true, onDismiss: () => setEnabled(true)},
							);
						}}
					/>
				</View>
			</RoundedView>
			<RoundedView style={style.rounded}>
				<TouchableOpacity
					style={style.touchable}
					onPress={() =>
						navigation.navigate("DigitalPassword", {action: "new"})
					}>
					<Text style={style.text}>{getStr("digitalPassword")}</Text>
					<View style={{flexDirection: "row", alignItems: "center"}}>
						<Text style={style.version}>{getStr("configured")}</Text>
						<IconRight height={20} width={20} />
					</View>
				</TouchableOpacity>
			</RoundedView>
			<Text style={{marginLeft: 8, marginTop: 16, color: colors.fontB2}}>
				{getStr("usePasswordIn")}
			</Text>
			<RoundedView style={[style.rounded, {marginTop: 4}]}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("enterApp")}</Text>
					<Switch
						thumbColor={
							verifyPasswordBeforeEnterApp === true
								? colors.primaryLight
								: undefined
						}
						trackColor={{true: colors.mainTheme}}
						value={verifyPasswordBeforeEnterApp === true}
						onValueChange={(value) => {
							store.dispatch(configSet("verifyPasswordBeforeEnterApp", value));
						}}
					/>
				</View>
				<View style={style.separator} />
				<TouchableOpacity
					style={style.touchable}
					onPress={() => navigation.navigate("AppSecretCustomize")}>
					<Text style={style.text}>{getStr("custom")}</Text>
					<View style={{flexDirection: "row", alignItems: "center"}}>
						<Text style={style.version}>{customizeText}</Text>
						<IconRight height={20} width={20} />
					</View>
				</TouchableOpacity>
			</RoundedView>
			<RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("useBiometrics")}</Text>
					<Switch
						thumbColor={
							useBiometrics === true ? colors.primaryLight : undefined
						}
						trackColor={{true: colors.mainTheme}}
						value={useBiometrics === true}
						onValueChange={(enable) => {
							if (enable) {
								rnBiometrics
									.simplePrompt({promptMessage: getStr("useBiometrics")})
									.then(({success}) => {
										if (success) {
											store.dispatch(configSet("useBiometrics", true));
										}
									})
									.catch((e) => {
										Snackbar.show({
											text: e?.message,
											duration: Snackbar.LENGTH_SHORT,
										});
									});
							} else {
								store.dispatch(configSet("useBiometrics", false));
							}
						}}
					/>
				</View>
			</RoundedView>
		</View>
	);
};

export const AppSecretScreen = connect((state: State) => ({
	...state.credentials,
	...state.config,
}))(AppSecretUI);
