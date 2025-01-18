import {Platform} from "react-native";
import {check, PERMISSIONS, request, RESULTS} from "react-native-permissions";
import {CameraRoll} from "@react-native-camera-roll/camera-roll";
import {getStr} from "./i18n";
import Snackbar from "react-native-snackbar";

export const saveImg = async (uri: string) => {
	const permission =
		Platform.OS === "android" && Platform.Version >= 33
			? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
			: PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
	const checkPermissions = await check(permission);
	if (checkPermissions === RESULTS.DENIED) {
		const requestPermissions = await request(permission);
		if (requestPermissions !== RESULTS.GRANTED) {
			Snackbar.show({
				text: getStr("permissionDenied"),
				duration: Snackbar.LENGTH_SHORT,
			});
			return;
		}
	}
	if (
		checkPermissions === RESULTS.BLOCKED ||
		checkPermissions === RESULTS.LIMITED
	) {
		Snackbar.show({
			text: getStr("permissionDenied"),
			duration: Snackbar.LENGTH_SHORT,
		});
		return;
	}
	CameraRoll.saveAsset(uri, {type: "photo"})
		.then(() =>
			Snackbar.show({
				text: getStr("saveSucceed"),
				duration: Snackbar.LENGTH_SHORT,
			}),
		)
		.catch(() =>
			Snackbar.show({
				text: getStr("saveFailRetry"),
				duration: Snackbar.LENGTH_SHORT,
			}),
		);
};
