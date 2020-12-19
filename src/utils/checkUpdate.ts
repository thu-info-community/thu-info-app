import {getBroadcastData, getUpdateInfo} from "../network/update";
import {currState, store} from "../redux/store";
import {Alert, Linking} from "react-native";
import {getStr} from "./i18n";
import {SET_DO_NOT_REMIND, SET_LAST_BROADCAST_ID} from "../redux/constants";
import Snackbar from "react-native-snackbar";
import VersionNumber from "react-native-version-number";
import {gt, lt} from "semver";

export const checkUpdate = (force: boolean = false) => {
	console.log("Current version: " + VersionNumber.appVersion);
	getUpdateInfo()
		.then((r) => r.filter((it) => gt(it.versionName, VersionNumber.appVersion)))
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
							onPress: () => {
								store.dispatch({
									type: SET_DO_NOT_REMIND,
									payload: r[0].versionName,
								});
							},
						},
						{text: getStr("nextTimeMust")},
						{
							text: getStr("download"),
							onPress: () => {
								Linking.openURL(r[0].url).then(() =>
									console.log("Opening system explorer: " + r[0].url),
								);
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
							store.dispatch({type: SET_LAST_BROADCAST_ID, payload: r[0].id}),
					},
				],
				{cancelable: true},
			);
		}
	});
};
