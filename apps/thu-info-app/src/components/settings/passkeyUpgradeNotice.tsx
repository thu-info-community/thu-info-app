import {useEffect, useState} from "react";
import {AppState, Platform} from "react-native";
import {useIsFocused} from "@react-navigation/native";
import {useSelector} from "react-redux";
import type {RootNav} from "../Root";
import {persistor, store} from "../../redux/store";
import type {State} from "../../redux/store";
import {dismissPasskeyUpgrade} from "../../redux/slices/auth";
import {passkeyAvailable} from "../../utils/passkeyNative";
import {PasskeySettings} from "./passkeySettings";

export const PasskeyUpgradeNotice = ({navigation}: {navigation: RootNav}) => {
	const auth = useSelector((state: State) => state.auth);
	const config = useSelector((state: State) => state.config);
	const focused = useIsFocused();
	const [foreground, setForeground] = useState(
		AppState.currentState === "active",
	);
	const [promptUserId, setPromptUserId] = useState<string>();
	useEffect(() => {
		const subscription = AppState.addEventListener("change", (state) =>
			setForeground(state === "active"),
		);
		return () => subscription.remove();
	}, []);
	const ready =
		focused &&
		foreground &&
		!config.appLocked &&
		config.studentNotified === true &&
		(Platform.OS === "ios" ||
			Platform.OS === "android" ||
			config.privacy312 === true);
	useEffect(() => {
		if (
			!ready ||
			!passkeyAvailable ||
			!auth.passkeyUpgradePending ||
			!auth.userId ||
			auth.userId === "8888" ||
			auth.passkeys[auth.userId]
		)
			return;
		setPromptUserId(auth.userId);
		// Persist the acknowledgement even when setup is skipped or fails.
		store.dispatch(dismissPasskeyUpgrade());
		persistor.flush().catch(() => undefined);
	}, [ready, auth]);
	if (!ready || !promptUserId || promptUserId !== auth.userId) return null;
	return (
		<PasskeySettings
			key={promptUserId}
			navigation={navigation}
			setup={{mode: "prompt", onFinished: () => setPromptUserId(undefined)}}
		/>
	);
};
