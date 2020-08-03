import {PermissionsAndroid, Platform} from "react-native";
import {hasAndroidPermission} from "./permissions";
import CameraRoll from "@react-native-community/cameraroll";
import {getStr} from "./i18n";
import Snackbar from "react-native-snackbar";

export const saveImg = async (uri: string) => {
	if (
		Platform.OS === "android" &&
		!(await hasAndroidPermission(
			PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
		))
	) {
		Snackbar.show({
			text: getStr("permissionDenied"),
			duration: Snackbar.LENGTH_SHORT,
		});
	} else {
		CameraRoll.save(uri)
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
	}
};
