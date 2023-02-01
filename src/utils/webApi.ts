import VersionNumber from "react-native-version-number";
import {Platform} from "react-native";
import {getModel} from "react-native-device-info";
import {helper} from "../redux/store";
import {
	HubConnection,
	HubConnectionBuilder,
	HubConnectionState,
} from "@microsoft/signalr";

let rootUrl = "https://thuinfo.net";
let rootUrlInited = false;
const getRootUrl = async () => {
	if (!rootUrlInited) {
		const req = await fetch("https://stu.cs.tsinghua.edu.cn/thuinfo/url");
		try {
			const resp: {url: string} = await req.json();
			rootUrl = resp.url;
		} catch {
			// no-op
		}
		rootUrlInited = true;
	}
	return rootUrl;
};

export const getLatestAnnounces = async () => {
	let url = `${await getRootUrl()}/api/announce?page=1`;
	let resp = await fetch(url);
	let json: {id: number; content: string; createdTime: string}[] =
		await resp.json();
	return json.map((i) => ({
		id: i.id,
		message: i.content,
		createdAt: Date.parse(i.createdTime),
	}));
};

export const getLatestVersion = async (isIos: boolean) => {
	let url = `${await getRootUrl()}/api/version/${isIos ? "ios" : "android"}`;
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
	let resp = await fetch(`${await getRootUrl()}/api/feedback`, {
		method: "POST",
		body: JSON.stringify(dto),
		headers: {"content-type": "application/json"},
	});
	if (!resp.ok) {
		throw new Error();
	}
};

export const getFeedbackReplies = async () => {
	let resp = await fetch(`${await getRootUrl()}/api/repliedfeedback`);
	let json: {
		content: string;
		reply: string;
		replierName: string;
		repliedTime: string;
	}[] = await resp.json();
	return json.map((i) => ({question: i.content, answer: i.reply}));
};

export const getWeChatGroupQRCodeContent = async () => {
	return await (await fetch(`${await getRootUrl()}/api/qrcode`)).text();
};

export type SocketStatus = "available" | "unavailable" | "unknown";

export const getSocketsStatusBySectionId = async (
	sectionId: number,
): Promise<{seatId: number; status: SocketStatus}[]> => {
	return await (
		await fetch(`${await getRootUrl()}/api/socket?sectionid=${sectionId}`)
	).json();
};

export const toggleSocketState = async (
	seatId: number,
	target: SocketStatus,
) => {
	let dto = {
		seatId,
		isavailable: target === "available",
	};
	let json = JSON.stringify(dto);
	let resp = await fetch(`${await getRootUrl()}/api/socket`, {
		method: "POST",
		headers: {"content-type": "application/json"},
		body: json,
	});
	if (!resp.ok) {
		throw new Error();
	}
};

export enum FunctionType {
	PhysicalExam,
	TeachingEvaluation,
	Report,
	Classrooms,
	Library,
	GymnasiumReg,
	PrivateRooms,
	Expenditures,
	Bank,
	Invoice,
	WasherInfo,
	QZYQ,
	DormScore,
	Electricity,
}

export const addUsageStat = async (func: FunctionType) => {
	fetch(`${await getRootUrl()}/stat/usage/${func.valueOf()}`);
};

export const addStartupStat = async () => {
	fetch(`${await getRootUrl()}/stat/startup`);
};

export interface ScheduleSyncSending {
	kind: "send";
	start: (matched: (token: string) => void) => Promise<void>;
	confirmAndSend: (json: string, sent?: () => void) => Promise<void>;
	stop: () => Promise<void>;
}
export class ScheduleSyncSending {
	kind: "send" = "send";
	private readonly _id: string;
	private static _conn?: HubConnection;
	private _token?: string;

	constructor(id: string) {
		this._id = id;
		if (
			ScheduleSyncSending._conn &&
			ScheduleSyncSending._conn.state === HubConnectionState.Connected
		) {
			ScheduleSyncSending._conn.stop();
		}
		ScheduleSyncSending._conn = new HubConnectionBuilder()
			.withUrl(`${rootUrl}/schedulesynchub`)
			.build();
	}

	start = async (matched: (token: string) => void) => {
		ScheduleSyncSending._conn?.off("SetTarget");
		ScheduleSyncSending._conn?.off("ConfirmMatch");

		await ScheduleSyncSending._conn?.start();
		ScheduleSyncSending._conn?.on("ConfirmMatch", (token) => {
			this._token = token;
			matched(token);
		});
		await ScheduleSyncSending._conn?.send("StartMatch", this._id, true);
	};

	confirmAndSend = async (json: string, sent?: () => void) => {
		ScheduleSyncSending._conn?.on("SetTarget", async (target) => {
			await ScheduleSyncSending._conn?.send("SendToTarget", target, json);
			await ScheduleSyncSending._conn?.stop();
			sent?.();
		});
		await ScheduleSyncSending._conn?.send(
			"ConfirmMatch",
			this._id,
			this._token,
			true,
		);
	};

	stop = async () => {
		if (ScheduleSyncSending._conn?.state === HubConnectionState.Connected) {
			await ScheduleSyncSending._conn?.stop();
		}
	};
}

export interface ScheduleSyncReceiving {
	kind: "receive";
	start: (matched: (token: string) => void) => Promise<void>;
	confirmAndReceive: (receive: (json: string) => void) => Promise<void>;
	stop: () => Promise<void>;
}
export class ScheduleSyncReceiving {
	kind: "receive" = "receive";
	private readonly _id: string;
	private static _conn?: HubConnection;
	private _token?: string;

	constructor(id: string) {
		this._id = id;
		if (
			ScheduleSyncReceiving._conn &&
			ScheduleSyncReceiving._conn.state === HubConnectionState.Connected
		) {
			ScheduleSyncReceiving._conn.stop();
		}
		ScheduleSyncReceiving._conn = new HubConnectionBuilder()
			.withUrl(`${rootUrl}/schedulesynchub`)
			.build();
	}

	start = async (matched: (token: string) => void) => {
		ScheduleSyncReceiving._conn?.off("ReceiveSchedules");
		ScheduleSyncReceiving._conn?.off("ConfirmMatch");

		await ScheduleSyncReceiving._conn?.start();
		ScheduleSyncReceiving._conn?.on("ConfirmMatch", (token) => {
			this._token = token;
			matched?.(token);
		});
		await ScheduleSyncReceiving._conn?.send("StartMatch", this._id, false);
	};

	confirmAndReceive = async (receive: (json: string) => void) => {
		ScheduleSyncReceiving._conn?.on("ReceiveSchedules", async (json) => {
			receive(json);
			await ScheduleSyncReceiving._conn?.stop();
		});
		await ScheduleSyncReceiving._conn?.send(
			"ConfirmMatch",
			this._id,
			this._token,
			false,
		);
	};

	stop = async () => {
		if (ScheduleSyncReceiving._conn?.state === HubConnectionState.Connected) {
			await ScheduleSyncReceiving._conn?.stop();
		}
	};
}
