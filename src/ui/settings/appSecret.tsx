import {getStr} from "../../utils/i18n";
import {State} from "../../redux/store";
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
	appSecret,
	clearAppSecret,
	verifyPasswordBeforeEnterApp,
	verifyPasswordBeforeEnterReport,
	verifyPasswordBeforeEnterFinance,
	verifyPasswordBeforeEnterPhysicalExam,
	useBiometrics,
	setUseBiometrics,
	enableVerificationBeforeEnterApp,
}: {
	navigation: RootNav;
	appSecret: string | undefined;
	clearAppSecret: () => void;
	verifyPasswordBeforeEnterApp: boolean | undefined;
	verifyPasswordBeforeEnterReport: boolean | undefined;
	verifyPasswordBeforeEnterFinance: boolean | undefined;
	verifyPasswordBeforeEnterPhysicalExam: boolean | undefined;
	useBiometrics: boolean | undefined;
	setUseBiometrics: (value: boolean) => void;
	enableVerificationBeforeEnterApp: (value: boolean) => void;
}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const {colors} = themes(themeName);

	const protectedStrings = [];
	if (verifyPasswordBeforeEnterReport) {
		protectedStrings.push(getStr("report"));
	}
	if (verifyPasswordBeforeEnterFinance) {
		protectedStrings.push(getStr("campusFinance"));
	}
	if (verifyPasswordBeforeEnterPhysicalExam) {
		protectedStrings.push(getStr("physicalExam"));
	}
	const protectedText = protectedStrings.join(getStr("、"));

	const customizeText =
		protectedText.length === 0
			? ""
			: getStr("enter") + protectedText + getStr("when");

	return (
		<View style={{flex: 1, padding: 12}}>
			<RoundedView style={style.rounded}>
				<View style={style.touchable}>
					<Text style={style.text}>{getStr("appSecret")}</Text>
					<Switch
						thumbColor={colors.contentBackground}
						trackColor={{true: colors.themePurple}}
						value={appSecret !== undefined}
						onValueChange={() => {
							if (appSecret === undefined) {
								navigation.navigate("DigitalPassword", {action: "new"});
								return;
							}
							Alert.alert(
								getStr("confirmDisableAppSecretTitle"),
								getStr("confirmDisableAppSecretMessage"),
								[
									{text: getStr("cancel")},
									{text: getStr("confirm"), onPress: clearAppSecret},
								],
								{cancelable: true},
							);
						}}
					/>
				</View>
			</RoundedView>
			{appSecret !== undefined && (
				<>
					<RoundedView style={style.rounded}>
						<TouchableOpacity
							style={style.touchable}
							onPress={() =>
								navigation.navigate("DigitalPassword", {action: "new"})
							}>
							<Text style={style.text}>{getStr("changePassword")}</Text>
							<IconRight height={20} width={20} />
						</TouchableOpacity>
					</RoundedView>
					<Text style={{marginLeft: 8, marginTop: 16, color: colors.fontB2}}>
						{getStr("usePasswordIn")}
					</Text>
					<RoundedView style={[style.rounded, {marginTop: 4}]}>
						<View style={style.touchable}>
							<Text style={style.text}>{getStr("enterApp")}</Text>
							<Switch
								thumbColor={colors.contentBackground}
								trackColor={{true: colors.themePurple}}
								value={verifyPasswordBeforeEnterApp === true}
								onValueChange={(value) => {
									enableVerificationBeforeEnterApp(value);
								}}
							/>
						</View>
						<View style={style.separator} />
						<TouchableOpacity
							style={style.touchable}
							disabled={verifyPasswordBeforeEnterApp}
							onPress={() => navigation.navigate("AppSecretCustomize")}>
							<Text
								style={[
									style.text,
									{
										color: verifyPasswordBeforeEnterApp
											? colors.fontB2
											: colors.text,
									},
								]}>
								{getStr("custom")}
							</Text>
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
								thumbColor={colors.contentBackground}
								trackColor={{true: colors.themePurple}}
								value={useBiometrics === true}
								onValueChange={(enable) => {
									if (enable) {
										rnBiometrics
											.simplePrompt({promptMessage: getStr("useBiometrics")})
											.then(({success}) => {
												if (success) {
													setUseBiometrics(true);
												}
											})
											.catch((e) => {
												Snackbar.show({
													text: e?.message,
													duration: Snackbar.LENGTH_SHORT,
												});
											});
									} else {
										setUseBiometrics(false);
									}
								}}
							/>
						</View>
					</RoundedView>
				</>
			)}
		</View>
	);
};

export const AppSecretScreen = connect(
	(state: State) => ({
		...state.credentials,
		...state.config,
	}),
	(dispatch) => ({
		clearAppSecret: () => {
			dispatch(setAppSecretAction(undefined));
			dispatch(clearAppSecretAction());
		},
		setUseBiometrics: (value: boolean) =>
			dispatch(configSet("useBiometrics", value)),
		enableVerificationBeforeEnterApp: (value: boolean) => {
			dispatch(configSet("verifyPasswordBeforeEnterApp", value));
			if (value) {
				dispatch(configSet("verifyPasswordBeforeEnterReport", false));
			}
		},
	}),
)(AppSecretUI);
