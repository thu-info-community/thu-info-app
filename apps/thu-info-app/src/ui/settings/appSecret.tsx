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
import {useDispatch, useSelector} from "react-redux";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";
import {styles} from "./settings";
import {RootNav} from "../../components/Root";
import {setAppSecret} from "../../redux/slices/credentials";
import IconRight from "../../assets/icons/IconRight";
import {configSet} from "../../redux/slices/config";
import ReactNativeBiometrics from "react-native-biometrics";
import Snackbar from "react-native-snackbar";
import {clearAppSecret} from "../../redux/slices/config";

const rnBiometrics = new ReactNativeBiometrics();

export const AppSecretScreen = ({navigation}: {navigation: RootNav}) => {
	const themeName = useColorScheme();
	const style = styles(themeName);
	const {colors} = themes(themeName);

	const appSecret = useSelector((s: State) => s.credentials.appSecret);
	const {
		appSecretLockMinutes,
		verifyPasswordBeforeEnterApp,
		verifyPasswordBeforeEnterReport,
		verifyPasswordBeforeEnterFinance,
		verifyPasswordBeforeEnterPhysicalExam,
		useBiometrics,
	} = useSelector((s: State) => s.config);
	const dispatch = useDispatch();

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
	const protectedText = protectedStrings.join(getStr("slightPauseMark"));

	const minuteText = getStr(appSecretLockMinutes === 1 ? "minute" : "minutes");
	const lockText =
		appSecretLockMinutes === 0
			? getStr("instantly")
			: `${appSecretLockMinutes} ${minuteText}`;

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
									{
										text: getStr("confirm"),
										onPress: () => {
											dispatch(setAppSecret(undefined));
											dispatch(clearAppSecret());
										},
									},
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
							<Text style={style.text}>{getStr("digitalPassword")}</Text>
							<View style={{flexDirection: "row", alignItems: "center"}}>
								<Text style={style.version}>{getStr("changePassword")}</Text>
								<IconRight height={20} width={20} />
							</View>
						</TouchableOpacity>
						<View style={style.separator} />
						<TouchableOpacity
							style={style.touchable}
							onPress={() => navigation.navigate("AppSecretSelectLockTime")}>
							<Text style={style.text}>{getStr("lockTime")}</Text>
							<View style={{flexDirection: "row", alignItems: "center"}}>
								<Text style={style.version}>{lockText}</Text>
								<IconRight height={20} width={20} />
							</View>
						</TouchableOpacity>
					</RoundedView>
					<Text style={{marginLeft: 8, marginTop: 16, color: colors.fontB2}}>
						{getStr("passwordUsedWhen")}
					</Text>
					<RoundedView style={[style.rounded, {marginTop: 4}]}>
						<View style={style.touchable}>
							<Text style={style.text}>{getStr("enterApp")}</Text>
							<Switch
								thumbColor={colors.contentBackground}
								trackColor={{true: colors.themePurple}}
								value={verifyPasswordBeforeEnterApp === true}
								onValueChange={(value) => {
									dispatch(
										configSet({key: "verifyPasswordBeforeEnterApp", value}),
									);
									if (value) {
										dispatch(
											configSet({
												key: "verifyPasswordBeforeEnterReport",
												value: false,
											}),
										);
										dispatch(
											configSet({
												key: "verifyPasswordBeforeEnterPhysicalExam",
												value: false,
											}),
										);
										dispatch(
											configSet({
												key: "verifyPasswordBeforeEnterFinance",
												value: false,
											}),
										);
									}
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
													dispatch(
														configSet({key: "useBiometrics", value: true}),
													);
												}
											})
											.catch((e) => {
												Snackbar.show({
													text: e?.message,
													duration: Snackbar.LENGTH_SHORT,
												});
											});
									} else {
										dispatch(configSet({key: "useBiometrics", value: false}));
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
