import {currState} from "../redux/store";
import {Platform} from "react-native";
import {helper} from "../redux/store";
import {getLatestAnnounces, getLatestVersion} from "../utils/webApi";

interface UpdateInfo {
	versionName: string;
	url: string;
	description: string;
}

export const getUpdateInfo = (): Promise<UpdateInfo[]> =>
	helper.mocked()
		? Promise.resolve([])
		: getLatestVersion(Platform.OS === "ios");

export const getBroadcastData = () =>
	getLatestAnnounces().then((i) =>
		i.filter((ii) => ii.createdAt > (currState().config.lastBroadcast ?? 0)),
	);
