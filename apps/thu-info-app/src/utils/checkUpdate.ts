import {currState, helper, store} from "../redux/store";
import {Alert, Linking, Platform} from "react-native";
import {useSelector} from "react-redux";
import type {State} from "../redux/store";
import {getStr} from "./i18n";
import {configSet} from "../redux/slices/config";
import {Snackbar} from "react-native-snackbar";
import VersionNumber from "react-native-version-number";
import {gt, lt, valid} from "semver";
import {NetworkRetry} from "../components/easySnackbars";

export const useHasAppUpdate = () =>
	useSelector(({config}: State) => {
		const {latestVersion, doNotRemindSemver} = config;
		return (
			Platform.OS === "android" &&
			latestVersion !== undefined &&
			valid(latestVersion) !== null &&
			gt(latestVersion, VersionNumber.appVersion) &&
			gt(latestVersion, doNotRemindSemver ?? "0.0.0")
		);
	});

export const refreshLatestVersion = async () => {
	if (Platform.OS !== "android" || !helper.hasAuthentication()) return;
	try {
		const {versionName} = await helper.getLatestVersion("android");
		if (valid(versionName)) {
			store.dispatch(configSet({key: "latestVersion", value: versionName}));
		}
	} catch {
		// The next startup or manual check can retry.
	}
};

export const openUpdateDownload = async (downloadUrl: string) => {
	try {
		await Linking.openURL(downloadUrl);
	} catch {
		NetworkRetry();
	}
};

export const checkUpdate = (force: boolean = false) => {
	if (Platform.OS !== "android") {
		return;
	}
	helper.getLatestVersion("android").then((r) => {
		if (!valid(r.versionName)) {
			NetworkRetry();
			return;
		}
		if (
			gt(r.versionName, VersionNumber.appVersion) &&
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
					{
						text: getStr("download"),
						onPress: () => openUpdateDownload(r.downloadUrl),
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
	}).catch(NetworkRetry);
};
