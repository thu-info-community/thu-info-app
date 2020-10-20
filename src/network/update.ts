import {retrieve} from "./core";
import {
	BROADCAST_URL,
	TSINGHUA_CLOUD_URL,
	UPDATE_INFO_URL_ANDRIOD,
	UPDATE_INFO_URL_IOS,
} from "../constants/strings";
import VersionNumber from "react-native-version-number";
import {currState, mocked} from "../redux/store";
import {Platform} from "react-native";

interface UpdateInfo {
	versionCode: number;
	versionName: string;
	url: string;
	description: string;
}

interface Broadcast {
	message: string;
	id: number;
}

export const getUpdateInfo = () =>
	mocked()
		? Promise.resolve([])
		: retrieve(
				Platform.OS === "ios" ? UPDATE_INFO_URL_IOS : UPDATE_INFO_URL_ANDRIOD,
				TSINGHUA_CLOUD_URL,
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  )
				.then(JSON.parse)
				.then((o: UpdateInfo[]) =>
					o
						.filter((it) => it.versionCode > Number(VersionNumber.buildVersion))
						.sort((a, b) => b.versionCode - a.versionCode),
				);

export const getBroadcastData = () =>
	mocked()
		? Promise.resolve([])
		: retrieve(BROADCAST_URL, TSINGHUA_CLOUD_URL)
				.then(JSON.parse)
				.then((o: Broadcast[]) =>
					o
						.filter((it) => it.id > (currState().config.lastBroadcast ?? 0))
						.sort((a, b) => b.id - a.id),
				);
