import {useEffect, useRef, useState} from "react";
import {ScrollView, Text, TextInput, useColorScheme, View} from "react-native";
import {KeyboardAvoidingScreen} from "../../components/keyboardAvoidingScreen";
import {PrimaryButton, SecondaryButton} from "../../components/subpage/buttons";
import type {RootNav, PasskeyMigrationRouteProp} from "../../components/Root";
import themes from "../../assets/themes/themes";
import {getStr} from "../../utils/i18n";
import {getPasskeyCapabilities} from "../../utils/passkeyNative";
import {migratePasskey} from "../../utils/passkey";
import {currState, helper, store} from "../../redux/store";
import {logout} from "../../redux/slices/auth";
import {PasskeyError} from "@thu-info/lib/src/utils/error";

export const PasskeyMigrationScreen = ({
	route: {params},
}: {
	navigation: RootNav;
	route: PasskeyMigrationRouteProp;
}) => {
	const {colors} = themes(useColorScheme());
	const [usePassword, setUsePassword] = useState(
		params.reason === "rp-changed",
	);
	const [password, setPassword] = useState("");
	const [processing, setProcessing] = useState(false);
	const [rootHint, setRootHint] = useState(false);
	const [error, setError] = useState("");
	const running = useRef(false);
	const mounted = useRef(true);
	useEffect(() => {
		mounted.current = true;
		return () => { mounted.current = false; };
	}, []);
	const perform = async () => {
		if (running.current || currState().auth.userId !== params.userId) return;
		running.current = true;
		setProcessing(true);
		setError("");
		try {
			const capabilities = await getPasskeyCapabilities();
			if (!mounted.current || currState().auth.userId !== params.userId) return;
			if (
				currState().auth.passkeys[params.userId]?.authenticationMode === "required" &&
				["not-configured", "unsupported"].includes(
					capabilities.verificationAvailability,
				)
			) {
				setError(getStr("passkeyVerificationUnavailable"));
				return;
			}
			if (capabilities.rootHint && !rootHint) {
				setRootHint(true);
				return;
			}
			const enteredPassword = usePassword ? password : undefined;
			setPassword("");
			await migratePasskey(enteredPassword);
		} catch (failure) {
			if (!mounted.current) return;
			const code = failure instanceof PasskeyError ? failure.code : undefined;
			if (
				[
					"counter-mismatch",
					"password-required",
					"missing",
					"revoked",
					"unavailable",
					"unsupported",
				].includes(code ?? "")
			) {
				setUsePassword(true);
				setError(getStr(code === "counter-mismatch" ? "passkeyCounterMismatch" : "passkeyMigrationPasswordRequired"));
			} else {
				setError(
					getStr(
						code === "canceled" || code === "locked"
							? "passkeyMigrationCanceled"
							: code === "verification-unavailable"
								? "passkeyVerificationUnavailable"
								: code === "rp-changed"
									? "passkeyRpChanged"
									: "passkeyMigrationFailed",
					),
				);
			}
		} finally {
			running.current = false;
			if (mounted.current) setProcessing(false);
		}
	};
	return (
		<KeyboardAvoidingScreen>
			<ScrollView
				keyboardShouldPersistTaps="handled"
				contentContainerStyle={{flexGrow: 1, padding: 24}}>
				<View
					style={{width: "100%", maxWidth: 480, alignSelf: "center", gap: 20}}>
					<Text style={{color: colors.text, fontSize: 24, fontWeight: "600"}}>
						{getStr("passkeyMigrationTitle")}
					</Text>
					<Text style={{color: colors.text, fontSize: 17}}>
						{getStr(
							params.reason === "rp-changed"
								? "passkeyRpChanged"
								: "passkeyMigrationPrompt",
						)}
					</Text>
					<Text style={{color: colors.text}}>{params.userId}</Text>
					{rootHint && (
						<Text style={{color: colors.text, fontSize: 17}}>
							{getStr("passkeyRootHint")}
						</Text>
					)}
					{usePassword && (
						<TextInput
							testID="passkeyMigrationPassword"
							accessibilityLabel={getStr("password")}
							placeholder={getStr("password")}
							placeholderTextColor={colors.fontB2}
							value={password}
							onChangeText={setPassword}
							editable={!processing}
							secureTextEntry
							style={{
								color: colors.text,
								borderColor: colors.inputBorder,
								borderWidth: 1,
								borderRadius: 8,
								padding: 14,
								fontSize: 17,
							}}
						/>
					)}
					{error !== "" && (
						<Text
							accessibilityRole="alert"
							style={{color: colors.statusError, fontSize: 17}}>
							{error}
						</Text>
					)}
					<PrimaryButton
						testID="passkeyMigrationStart"
						text={getStr("passkeyMigrationTitle")}
						loading={processing}
						disabled={usePassword && password === ""}
						onPress={perform}
					/>
					{(!usePassword || params.reason === "upgrade") && (
						<SecondaryButton
							testID="passkeyMigrationPasswordChoice"
							disabled={processing}
							text={getStr(
								usePassword
									? "passkeyMigrationUseOld"
									: "passkeyMigrationUsePassword",
							)}
							onPress={() => {
								setUsePassword(!usePassword);
								setPassword("");
								setError("");
							}}
						/>
					)}
					<SecondaryButton
						text={getStr("logout")}
						disabled={processing}
						onPress={() => {
							setPassword("");
							store.dispatch(logout());
							helper.logout().catch(() => undefined);
						}}
					/>
				</View>
			</ScrollView>
		</KeyboardAvoidingScreen>
	);
};
