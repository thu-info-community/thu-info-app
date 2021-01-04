import {
	ANDROID_APP_CENTER_URL,
	BROADCAST_URL,
	IOS_APP_STORE_URL,
	TSINGHUA_CLOUD_URL,
	UPDATE_URL_ANDROID,
	UPDATE_URL_IOS,
} from "../constants/strings";
import {currState, helper} from "../redux/store";
import {Platform} from "react-native";
import {retrieve} from "../utils/network";

interface UpdateInfo {
	versionName: string;
	url: string;
	description: string;
}

interface Broadcast {
	message: string;
	id: number;
}

export const getUpdateInfo = (): Promise<UpdateInfo[]> =>
	helper.mocked()
		? Promise.resolve([])
		: Platform.OS === "ios"
		? retrieve(UPDATE_URL_IOS, UPDATE_URL_IOS)
				.then((s) => JSON.parse(s).results[0])
				.then(
					({
						version,
						releaseNotes,
					}: {
						version: string;
						releaseNotes: string;
					}) => [
						{
							versionName: version,
							url: IOS_APP_STORE_URL,
							description: releaseNotes,
						},
					],
				)
		: retrieve(UPDATE_URL_ANDROID, UPDATE_URL_ANDROID)
				.then(JSON.parse)
				.then(({tag_name, body}: {tag_name: string; body: string}) => [
					{
						versionName: tag_name,
						url: ANDROID_APP_CENTER_URL,
						description: body,
					},
				]);

export const getBroadcastData = () =>
	helper.mocked()
		? Promise.resolve([])
		: retrieve(BROADCAST_URL, TSINGHUA_CLOUD_URL)
				.then(JSON.parse)
				.then((o: Broadcast[]) =>
					o
						.filter((it) => it.id > (currState().config.lastBroadcast ?? 0))
						.sort((a, b) => b.id - a.id),
				);
