import {CONTENT_TYPE_FORM, USER_AGENT} from "../constants/strings";
import {Buffer} from "buffer";

export const stringify = (form: any) =>
	Object.keys(form)
		.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(form[key])}`)
		.join("&");

export const retrieve = async (url: string, referer?: string) =>
	new Promise<string>((resolve, reject) => {
		const request = new XMLHttpRequest();
		request.responseType = "arraybuffer";
		request.onload = () => {
			if (request.status === 200) {
				resolve(Buffer.from(request.response).toString());
			} else {
				reject(0);
			}
		};
		request.open("GET", url);
		request.setRequestHeader("Content-type", CONTENT_TYPE_FORM);
		request.setRequestHeader("User-Agent", USER_AGENT);
		if (referer !== undefined) {
			request.setRequestHeader("Referer", referer);
		}
		request.send(null);
	});
