import {currState, helper, store} from "../redux/store";
import {Alert, Linking, Platform} from "react-native";
import {getStr} from "./i18n";
import {configSet} from "../redux/slices/config";
import Snackbar from "react-native-snackbar";
import VersionNumber from "react-native-version-number";
import {gte, lt} from "semver";
import {NetworkRetry} from "../components/easySnackbars";
import {TUNA_BASE_URL, TUNA_LATEST_URL} from "../constants/strings";

export const checkUpdate = (force: boolean = false) => {
	if (Platform.OS !== "ios" && Platform.OS !== "android") {
		return;
	}
	helper.getLatestVersion(Platform.OS).then((r) => {
		if (
			gte(r.versionName, VersionNumber.appVersion) &&
			(force ||
				lt(currState().config.doNotRemindSemver ?? "0.0.0", r.versionName))
		) {
			Alert.alert(
				getStr("newVersionAvailable"),
				r.versionName + "\n" + r.releaseNote,
				[
					{
						text: getStr("ignoreThisVersion"),
						onPress: () =>
							store.dispatch(
								configSet({
									key: "doNotRemindSemver",
									value: r.versionName,
								}),
							),
					},
					{text: getStr("dismiss")},
					{
						text: getStr("download"),
						onPress: async () => {
							try {
								const {status} = await fetch(TUNA_BASE_URL + r.versionName);
								await Linking.openURL(
									Platform.OS === "ios" || status === 404
										? r.downloadUrl
										: TUNA_LATEST_URL,
								);
							} catch (e) {
								NetworkRetry();
							}
						},
					},
				],
				{cancelable: true},
			);
		} else if (force) {
			Snackbar.show({
				text: getStr("alreadyLatest"),
				duration: Snackbar.LENGTH_SHORT,
			});
		}
	});
};

export const checkBroadcast = () => {
	helper.getLatestAnnounces().then((r) => {
		if (r.length > 0) {
			Alert.alert(
				getStr("broadcast"),
				r.map((it) => it.content).join("\n"),
				[
					{
						text: getStr("confirm"),
						onPress: () =>
							store.dispatch(
								configSet({key: "lastBroadcast", value: r[0].createdAt}),
							),
					},
				],
				{cancelable: true},
			);
		}
	});
};
