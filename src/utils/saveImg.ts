import {PermissionsAndroid, Platform} from "react-native";
import {hasAndroidPermission} from "./permissions";
import {CameraRoll} from "@react-native-camera-roll/camera-roll";
import {getStr} from "./i18n";
import Snackbar from "react-native-snackbar";
import RNFS from "react-native-fs";
import md5 from "md5";
import {NetworkRetry} from "../components/easySnackbars";
import CookieManager from "@react-native-cookies/cookies";

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

export const saveRemoteImg = async (url: string) => {
	try {
		const fileName = `${RNFS.DocumentDirectoryPath}/${md5(url)}.jpeg`;
		const cookies = await CookieManager.get(url);
		const Cookie = Object.keys(cookies)
			.map((key) => `${key}=${cookies[key].value}`)
			.join(";");
		await RNFS.downloadFile({
			fromUrl: url,
			toFile: fileName,
			headers: {Cookie},
		}).promise;
		await saveImg("file://" + fileName);
	} catch (e) {
		NetworkRetry();
	}
};
