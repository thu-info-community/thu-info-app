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
