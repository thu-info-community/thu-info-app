import {useEffect, useRef, useState} from "react";
import {
	ActivityIndicator,
	Switch,
	Text,
	TouchableOpacity,
	useWindowDimensions,
	View,
} from "react-native";
import {useSelector} from "react-redux";
import {State} from "../../redux/store";
import {BottomPopupTriggerView, RoundedView} from "../views";
import {
	getPasskeyCapabilities,
	passkeyAvailable,
} from "../../utils/passkeyNative";
import {enablePasskey, disablePasskey} from "../../utils/passkey";
import {getStr} from "../../utils/i18n";
import type {RootNav} from "../Root";
import {styles} from "../../ui/settings/settings";
import {useColorScheme} from "react-native";
import {Snackbar} from "react-native-snackbar";
import IconRight from "../../assets/icons/IconRight";
import themes from "../../assets/themes/themes";
import {currState, persistor, store} from "../../redux/store";
import {
	setSilentPasskeyLogin,
	requirePasskeyRenewal,
} from "../../redux/slices/auth";
import {PasskeyError} from "@thu-info/lib/src/utils/error";
import {scaledLineHeight} from "../../utils/scaledText";

type PasskeyDialog =
	| "enable"
	| "remove"
	| "setupError"
	| "removeError"
	| "silentEnable"
	| "silentDisable"
	| "verificationUnavailable";

export const PasskeySettings = ({
	navigation,
	setup,
}: {
	navigation: RootNav;
	setup?: {mode: "automatic" | "prompt"; onFinished: () => void};
}) => {
	const auth = useSelector((state: State) => state.auth);
	const [processing, setProcessing] = useState(false);
	const [checkingCapabilities, setCheckingCapabilities] = useState(false);
	const [rootHint, setRootHint] = useState(false);
	const [dialog, setDialog] = useState<PasskeyDialog | null>(null);
	const capabilityRequest = useRef(0);
	const checkingCapabilitiesRef = useRef(false);
	const setupStarted = useRef(false);
	useEffect(() => {
		checkingCapabilitiesRef.current = false;
		setCheckingCapabilities(false);
		setRootHint(false);
		setDialog(null);
		return () => {
			capabilityRequest.current += 1;
		};
	}, [auth.userId]);
	const themeName = useColorScheme();
	const style = styles(themeName);
	const {colors} = themes(themeName);
	const {fontScale} = useWindowDimensions();
	const localPasskeys = Object.values(auth.passkeys);
	const credential = auth.userId
		? auth.passkeys[auth.userId]
		: localPasskeys.length === 1
			? localPasskeys[0]
			: undefined;
	const configured = !!credential || (!auth.userId && localPasskeys.length > 0);
	const silent = credential
		? credential.authenticationMode === "silent"
		: auth.silentPasskeyLogin?.[auth.userId] === true;
	const protection = credential?.protectionLevel;
	const protectionText =
		protection === "software"
			? getStr("passkeySystemProtection")
			: protection && ["strongbox", "tee", "hardware"].includes(protection)
				? getStr("passkeyDeviceProtection")
				: getStr("passkeyUnknown");
	const busy = processing || checkingCapabilities;

	const openSetupDialog = async (automatic = false) => {
		if (processing || checkingCapabilitiesRef.current) return;
		const request = ++capabilityRequest.current;
		checkingCapabilitiesRef.current = true;
		setCheckingCapabilities(true);
		setRootHint(false);
		const {rootHint: hint} = await getPasskeyCapabilities();
		if (request !== capabilityRequest.current) return;
		checkingCapabilitiesRef.current = false;
		setCheckingCapabilities(false);
		setRootHint(hint);
		if (automatic && !hint) {
			await perform(false);
			return;
		}
		setDialog("enable");
	};

	const changeSilent = async (enabled: boolean) => {
		if (!auth.userId) {
			navigation.navigate("Login");
			return;
		}
		if (processing || checkingCapabilitiesRef.current) return;
		if (enabled) {
			setDialog("silentEnable");
			return;
		}
		const request = ++capabilityRequest.current;
		checkingCapabilitiesRef.current = true;
		setCheckingCapabilities(true);
		const {verificationAvailability: verification} =
			await getPasskeyCapabilities();
		if (request !== capabilityRequest.current) return;
		checkingCapabilitiesRef.current = false;
		setCheckingCapabilities(false);
		if (["not-configured", "unsupported"].includes(verification))
			setDialog("verificationUnavailable");
		else if (credential) setDialog("silentDisable");
		else {
			store.dispatch(
				setSilentPasskeyLogin({userId: auth.userId, enabled: false}),
			);
			await persistor.flush();
		}
	};

	const perform = async (disable: boolean, changedSilent?: boolean) => {
		if (currState().auth.userId !== auth.userId) return;
		setProcessing(true);
		try {
			if (changedSilent !== undefined && !credential) {
				store.dispatch(
					setSilentPasskeyLogin({userId: auth.userId, enabled: changedSilent}),
				);
				await persistor.flush();
				return;
			}
			if (disable) {
				await disablePasskey();
				navigation.navigate("Login");
			} else {
				await enablePasskey(
					changedSilent === undefined
						? undefined
						: changedSilent
							? "silent"
							: "required",
				);
			}
			Snackbar.show({
				text: getStr(disable ? "passkeyRemoved" : "passkeyEnabled"),
				duration: Snackbar.LENGTH_LONG,
			});
			setup?.onFinished();
		} catch (error) {
			if (
				error instanceof PasskeyError &&
				["canceled", "locked", "interaction-required"].includes(error.code)
			) {
				setup?.onFinished();
				return;
			}
			setDialog(
				error instanceof PasskeyError &&
					error.code === "verification-unavailable"
					? "verificationUnavailable"
					: disable
						? "removeError"
						: "setupError",
			);
		} finally {
			setProcessing(false);
		}
	};
	useEffect(() => {
		if (
			!setup ||
			setupStarted.current ||
			!auth.userId ||
			credential ||
			!passkeyAvailable ||
			auth.userId === "8888"
		)
			return;
		setupStarted.current = true;
		openSetupDialog(setup.mode === "automatic");
		// A setup request is handled once; auth changes invalidate its capability check above.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [setup, auth.userId, credential]);

	if (!passkeyAvailable || auth.userId === "8888") return null;

	return (
		<>
			{!setup && (
				<RoundedView style={style.rounded}>
					<TouchableOpacity
						accessibilityRole="button"
						testID="passkeySettings"
						style={style.touchable}
						disabled={busy}
						onPress={() => {
							if (!auth.userId) {
								navigation.navigate("Login");
								return;
							}
							if (credential) setDialog("remove");
							else openSetupDialog();
						}}>
						<Text style={style.text}>Passkey</Text>
						<View
							style={{
								flexDirection: "row",
								alignItems: "center",
								flexShrink: 1,
								minWidth: 0,
							}}>
							{busy ? (
								<ActivityIndicator />
							) : (
								<Text style={style.version}>
									{getStr(configured ? "configured" : "notConfigured")}
								</Text>
							)}
							<IconRight height={20} width={20} />
						</View>
					</TouchableOpacity>
					{credential && auth.userId && (
						<>
							<View style={style.separator} />
							<TouchableOpacity
								accessibilityRole="button"
								style={style.touchable}
								disabled={busy}
								onPress={() =>
									store.dispatch(requirePasskeyRenewal(auth.userId))
								}>
								<Text style={style.text}>{getStr("passkeyReregister")}</Text>
								<IconRight height={20} width={20} />
							</TouchableOpacity>
						</>
					)}
					<View style={style.separator} />
					<View style={style.touchable}>
						<Text style={[style.text, {flex: 1}]}>
							{getStr("passkeySilentLogin")}
						</Text>
						<Switch
							accessibilityLabel={getStr("passkeySilentLogin")}
							testID="passkeySilentLogin"
							disabled={busy}
							value={silent}
							onValueChange={changeSilent}
						/>
					</View>
					{credential && (
						<>
							{credential.name && (
								<>
									<View style={style.separator} />
									<View style={style.touchable}>
										<Text style={style.text}>{getStr("idDeviceName")}</Text>
										{/* No `numberOfLines`: the device name is real information
									    and the row grows, so let it wrap instead of being
									    ellipsized at a large system font. */}
										<Text
											style={[
												style.version,
												{flex: 1, marginLeft: 16, textAlign: "right"},
											]}>
											{credential.name}
										</Text>
									</View>
								</>
							)}
							<View style={style.separator} />
							<View style={style.touchable}>
								<Text style={style.text}>{getStr("passkeyProtection")}</Text>
								<Text style={style.version}>{protectionText}</Text>
							</View>
						</>
					)}
				</RoundedView>
			)}
			<BottomPopupTriggerView
				style={{display: "none"}}
				disabled
				popupTitle="Passkey"
				popupVisible={dialog !== null}
				popupCanFulfill={!busy}
				popupCancelable
				popupFulfillText={getStr(
					dialog === "remove"
						? "passkeyRemove"
						: dialog === "silentDisable"
							? "confirm"
							: dialog === "enable" || dialog === "silentEnable"
								? "passkeyEnable"
								: "done",
				)}
				popupContent={
					<View style={{paddingHorizontal: 20}}>
						<Text
							style={{
								color: colors.text,
								fontSize: 17,
								lineHeight: scaledLineHeight(26, fontScale),
							}}>
							{getStr(
								dialog === "remove"
									? "passkeyRemovePrompt"
									: dialog === "setupError"
										? "passkeySetupFailed"
										: dialog === "removeError"
											? "passkeyRemoveFailed"
											: dialog === "silentEnable"
												? "passkeySilentWarning"
												: dialog === "silentDisable"
													? "passkeyVerifiedPrompt"
													: dialog === "verificationUnavailable"
														? "passkeyVerificationUnavailable"
														: setup?.mode === "prompt"
															? "passkeyUpgradePrompt"
															: "passkeyEnablePrompt",
							)}
						</Text>
						{credential &&
							(dialog === "silentEnable" || dialog === "silentDisable") && (
								<Text
									style={{
										color: colors.text,
										fontSize: 17,
										lineHeight: scaledLineHeight(26, fontScale),
										marginTop: 16,
									}}>
									{getStr("passkeyModeChangePrompt")}
								</Text>
							)}
						{rootHint && dialog === "enable" && (
							<Text
								style={{
									color: colors.text,
									fontSize: 17,
									lineHeight: scaledLineHeight(26, fontScale),
									marginTop: 16,
								}}>
								{getStr("passkeyRootHint")}
							</Text>
						)}
					</View>
				}
				popupOnCancelled={() => {
					setDialog(null);
					setup?.onFinished();
				}}
				popupOnFulfilled={() => {
					setDialog(null);
					if (dialog === "enable" || dialog === "remove")
						perform(dialog === "remove");
					else if (dialog === "silentEnable" || dialog === "silentDisable")
						perform(false, dialog === "silentEnable");
					else setup?.onFinished();
				}}
			/>
		</>
	);
};
