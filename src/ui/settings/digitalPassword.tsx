import {useEffect, useState} from "react";
import {getStr} from "../../utils/i18n";
import {Text, useColorScheme, View} from "react-native";
import themes from "../../assets/themes/themes";
import {RoundedView} from "../../components/views";
import {DigitalPasswordRouteProp, RootNav} from "../../components/Root";
import {
	CodeField,
	Cursor,
	useClearByFocusCell,
} from "react-native-confirmation-code-field";
import {State} from "../../redux/store";
import {setAppSecret} from "../../redux/slices/credentials";
import {useDispatch, useSelector} from "react-redux";
import ReactNativeBiometrics from "react-native-biometrics";
import {configSet, setupAppSecret} from "../../redux/slices/config";

const PASSWORD_LENGTH = 4;

const rnBiometrics = new ReactNativeBiometrics();

export const DigitalPasswordScreen = ({
	navigation,
	route: {params},
}: {
	navigation: RootNav | undefined; // undefined indicates that this screen is invoked directly from AuthFlow
	route: DigitalPasswordRouteProp;
}) => {
	const themeName = useColorScheme();
	const {colors} = themes(themeName);
	const [value, setValue] = useState("");
	const [props, getCellOnLayoutHandler] = useClearByFocusCell({
		value,
		setValue,
	});

	const appSecret = useSelector((s: State) => s.credentials.appSecret);
	const useBiometrics = useSelector((s: State) => s.config.useBiometrics);
	const dispatch = useDispatch();

	const title = getStr(
		params.action === "new"
			? "newPassword"
			: params.action === "confirm"
			? "confirmPassword"
			: "verifyPassword",
	);

	const mismatch =
		value.length === PASSWORD_LENGTH &&
		((params.action === "confirm" && params.payload !== value) ||
			(params.action === "verify" && appSecret !== value));

	useEffect(() => {
		if (
			params.action === "verify" &&
			params.target !== "AppSecret" &&
			useBiometrics === true
		) {
			rnBiometrics
				.simplePrompt({promptMessage: getStr("useBiometrics")})
				.then(({success}) => {
					if (success) {
						if (navigation) {
							navigation.replace(params.target);
							dispatch(configSet({key: "subFunctionUnlocked", value: true}));
						} else {
							dispatch(configSet({key: "appLocked", value: false}));
						}
					}
				});
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<View style={{flex: 1, padding: 12, justifyContent: "center"}}>
			<RoundedView
				style={{
					width: "100%",
					alignItems: "center",
					marginBottom: 16,
					borderRadius: 20,
				}}>
				<Text style={{color: colors.text, margin: 16, fontSize: 20}}>
					{title}
				</Text>
				<CodeField
					{...props}
					value={value}
					onChangeText={(v) => {
						if (v.match(/^\d{0,4}$/)) {
							setValue(v);
							if (v.length === 4) {
								if (navigation) {
									if (params.action === "new") {
										navigation.replace("DigitalPassword", {
											action: "confirm",
											payload: v,
										});
									} else if (params.action === "confirm") {
										if (v === params.payload) {
											navigation.pop();
											dispatch(setAppSecret(v));
											dispatch(setupAppSecret());
										}
									} else if (params.action === "verify") {
										if (appSecret === v) {
											navigation.replace(params.target);
											dispatch(
												configSet({key: "subFunctionUnlocked", value: true}),
											);
										}
									}
								} else {
									if (appSecret === v) {
										dispatch(configSet({key: "appLocked", value: false}));
									}
								}
							}
						}
					}}
					cellCount={PASSWORD_LENGTH}
					autoFocus={true}
					rootStyle={{margin: 16}}
					keyboardType="number-pad"
					textContentType="oneTimeCode"
					secureTextEntry={true}
					renderCell={({index, symbol, isFocused}) => (
						<View
							key={index}
							style={{
								width: 55,
								height: 73,
								paddingHorizontal: 12,
								paddingVertical: 8,
								borderWidth: 2,
								borderColor: isFocused ? colors.mainTheme : "#DDDDDD",
								borderRadius: 12,
								justifyContent: "center",
								marginLeft: index === 0 ? 0 : 12,
							}}>
							<Text
								style={{
									fontSize: 32,
									textAlign: "center",
									color: colors.primaryLight,
								}}
								onLayout={getCellOnLayoutHandler(index)}>
								{symbol ? "*" : isFocused ? <Cursor /> : null}
							</Text>
						</View>
					)}
				/>
			</RoundedView>
			{mismatch && (
				<View style={{alignItems: "center"}}>
					<RoundedView
						style={{
							position: "absolute",
							top: 32,
							paddingVertical: 8,
							paddingHorizontal: 16,
							borderColor: colors.statusWarning,
							borderWidth: 1,
							borderRadius: 20,
						}}>
						<Text style={{color: colors.statusWarning, fontSize: 16}}>
							{getStr(
								params.action === "confirm"
									? "confirmFailed"
									: "wrongPasswordHint",
							)}
						</Text>
					</RoundedView>
				</View>
			)}
		</View>
	);
};
