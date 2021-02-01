import {
	ANDROID_APP_CENTER_URL,
	IOS_APP_STORE_URL,
	UPDATE_URL_ANDROID,
	UPDATE_URL_IOS,
} from "../constants/strings";
import {currState} from "../redux/store";
import {Platform} from "react-native";
import AV from "leancloud-storage/core";
import {helper} from "../redux/store";

interface UpdateInfo {
	versionName: string;
	url: string;
	description: string;
}

export const getUpdateInfo = (): Promise<UpdateInfo[]> =>
	helper.mocked()
		? Promise.resolve([])
		: Platform.OS === "ios"
		? fetch(UPDATE_URL_IOS)
				.then((r) => r.json())
				.then((r) => r.results[0])
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
		: fetch(UPDATE_URL_ANDROID)
				.then((r) => r.json())
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
		: new AV.Query("Broadcast")
				.limit(1000)
				.find()
				.then((r) =>
					r.map((it) => ({
						message: it.get("message") as string,
						createdAt: Number(it.createdAt),
					})),
				)
				.then((o) =>
					o
						.filter(
							(it) => it.createdAt > (currState().config.lastBroadcast ?? 0),
						)
						.sort((a, b) => b.createdAt - a.createdAt),
				);
