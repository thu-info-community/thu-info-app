import {retrieve} from "./core";
import {
	TSINGHUA_CLOUD_URL,
	UPDATE_INFO_URL_ANDRIOD,
	UPDATE_INFO_URL_IOS,
} from "../constants/strings";
import VersionNumber from "react-native-version-number";
import {mocked} from "../redux/store";
import {Platform} from "react-native";

interface UpdateInfo {
	versionCode: number;
	versionName: string;
	url: string;
	description: string;
}

export const getUpdateInfo = () =>
	mocked()
		? Promise.resolve([])
		: retrieve(
				Platform.OS === "ios" ? UPDATE_INFO_URL_IOS : UPDATE_INFO_URL_ANDRIOD,
				TSINGHUA_CLOUD_URL,
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  )
				.then((o) => {
					console.log(o);
					return JSON.parse(o);
				})
				.then((o: UpdateInfo[]) =>
					o
						.filter((it) => it.versionCode > Number(VersionNumber.buildVersion))
						.sort((a, b) => b.versionCode - a.versionCode),
				);
