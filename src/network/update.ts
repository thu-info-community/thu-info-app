import {retrieve} from "./core";
import {TSINGHUA_CLOUD_URL, UPDATE_INFO_URL} from "../constants/strings";
import VersionNumber from "react-native-version-number";
import {mocked} from "../redux/store";

interface UpdateInfo {
	versionCode: number;
	versionName: string;
	url: string;
	description: string;
}

export const getUpdateInfo = () =>
	mocked()
		? Promise.resolve([])
		: retrieve(UPDATE_INFO_URL, TSINGHUA_CLOUD_URL)
				.then(JSON.parse)
				.then((o: UpdateInfo[]) =>
					o
						.filter((it) => it.versionCode > Number(VersionNumber.buildVersion))
						.sort((a, b) => b.versionCode - a.versionCode),
				);
