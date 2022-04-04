import VersionNumber from "react-native-version-number";
import {Platform} from "react-native";
import {getModel} from "react-native-device-info";
import {helper} from "../redux/store";

const rootUrl = "https://thuinfo.net";

export const getLatestAnnounces = async () => {
	let url = `${rootUrl}/api/announce?page=1`;
	let resp = await fetch(url);
	let json: {id: number; content: string; createdTime: string}[] =
		await resp.json();
	let result = json.map((i) => ({
		id: i.id,
		message: i.content,
		createdAt: Date.parse(i.createdTime),
	}));
	return result;
};

export const getLatestVersion = async (isIos: boolean) => {
	let url = `${rootUrl}/api/version/${isIos ? "ios" : "android"}`;
	let resp = await fetch(url);
	let json: {
		versionName: string;
		releaseNote: string;
		downloadUrl: string;
	} = await resp.json();
	return [
		{
			versionName: json.versionName,
			url: json.downloadUrl,
			description: json.releaseNote,
		},
	];
};

export const submitFeedback = async (
	content: string,
	contact: string = "",
	nickname: string = "",
) => {
	if (helper.mocked()) {
		return;
	}
	let version = Number(VersionNumber.buildVersion);
	let os = Platform.OS;
	let api = String(Platform.Version);
	let model = getModel();
	let dto = {
		content: content,
		appversion: version.toString(),
		os: `${os} ${api}`,
		nickname,
		contact,
		phonemodel: model,
	};
	let resp = await fetch(`${rootUrl}/api/feedback`, {
		method: "POST",
		body: JSON.stringify(dto),
		headers: {"content-type": "application/json"},
	});
	if (!resp.ok) {
		throw new Error();
	}
};

export const getFeedbackReplies = async () => {
	let resp = await fetch(`${rootUrl}/api/repliedfeedback`);
	let json: {
		content: string;
		nickName: string;
		reply: string;
		replierName: string;
		repliedTime: string;
	}[] = await resp.json();
	return json.map((i) => ({question: i.content, answer: i.reply}));
};

export const getWeChatGroupQRCodeContent = async () => {
	return await (await fetch(`${rootUrl}/api/qrcode`)).text();
};

export type SocketStatus = "available" | "unavailable" | "unknown";

export const getSocketsStatusBySectionId = async (
	sectionId: number,
): Promise<{seatId: number; status: SocketStatus}[]> => {
	return await (
		await fetch(`${rootUrl}/api/socket?sectionid=${sectionId}`)
	).json();
};

export const toggleSocketState = async (
	seatId: number,
	target: SocketStatus,
) => {
	let dto = {
		seatId,
		isavailable: target === "available" ? true : false,
	};
	let json = JSON.stringify(dto);
	let resp = await fetch(`${rootUrl}/api/socket`, {
		method: "POST",
		headers: {"content-type": "application/json"},
		body: json,
	});
	if (!resp.ok) {
		throw new Error();
	}
};
