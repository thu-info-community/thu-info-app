import {getBroadcastData, getUpdateInfo} from "../network/update";
import {currState, store} from "../redux/store";
import {Alert, Linking, Platform} from "react-native";
import {getStr} from "./i18n";
import {configSet} from "../redux/actions/config";
import Snackbar from "react-native-snackbar";
import VersionNumber from "react-native-version-number";
import {gte, lt} from "semver";
import {NetworkRetry} from "../components/easySnackbars";
import {TUNA_BASE_URL, TUNA_LATEST_URL} from "../constants/strings";

export const checkUpdate = (force: boolean = false) => {
	console.log("Current version: " + VersionNumber.appVersion);
	getUpdateInfo()
		.then((r) =>
			r.filter((it) => gte(it.versionName, VersionNumber.appVersion)),
		)
		.then((r) => {
			if (
				r.length &&
				(force ||
					lt(currState().config.doNotRemindSemver ?? "0.0.0", r[0].versionName))
			) {
				Alert.alert(
					getStr("newVersionAvailable"),
					r[0].versionName + "\n" + r[0].description,
					[
						{
							text: getStr("doNotRemind"),
							onPress: () =>
								store.dispatch(
									configSet("doNotRemindSemver", r[0].versionName),
								),
						},
						{text: getStr("nextTimeMust")},
						{
							text: getStr("download"),
							onPress: async () => {
								try {
									const {status} = await fetch(
										TUNA_BASE_URL + r[0].versionName,
									);
									await Linking.openURL(
										Platform.OS === "ios" || status === 404
											? r[0].url
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
			}
			if (force && r.length === 0) {
				Snackbar.show({
					text: getStr("alreadyLatest"),
					duration: Snackbar.LENGTH_SHORT,
				});
			}
		});
};

export const checkBroadcast = () => {
	getBroadcastData().then((r) => {
		if (r.length > 0) {
			Alert.alert(
				getStr("broadcast"),
				r.map((it) => it.message).join("\n"),
				[
					{
						text: getStr("confirm"),
						onPress: () =>
							store.dispatch(configSet("lastBroadcast", r[0].createdAt)),
					},
				],
				{cancelable: true},
			);
		}
	});
};
