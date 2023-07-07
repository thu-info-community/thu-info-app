import {Platform} from "react-native";
import {check, PERMISSIONS, request, RESULTS} from "react-native-permissions";
import {CameraRoll} from "@react-native-camera-roll/camera-roll";
import {getStr} from "./i18n";
import Snackbar from "react-native-snackbar";
import RNFS from "react-native-fs";
import md5 from "md5";
import {NetworkRetry} from "../components/easySnackbars";
import CookieManager from "@react-native-cookies/cookies";

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
