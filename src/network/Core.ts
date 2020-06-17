import {Auth, LoginStatus} from "../redux/states/auth";
import {
	CONTENT_TYPE_FORM,
	DO_LOGIN_URL,
	INFO_LOGIN_URL,
	INFO_URL,
	INVALIDATE_ZHJW_URL,
	LOGIN_URL,
	PROFILE_REFERER,
	PROFILE_URL,
	USER_AGENT,
} from "../constants/strings";
import {Buffer} from "buffer";
import iconv from "iconv-lite";

const stringify = (form: any) =>
	Object.keys(form)
		.map((key) => `${key}=${encodeURIComponent(form[key])}`)
		.join("&");

// Since there are strange things with `fetch` regarding to encodings,
// two different implementations of network connection are provided.

const connect = async (
	url: string,
	referer?: string,
	post?: object,
): Promise<void> => {
	const defaultHeaders = {
		"Content-Type": CONTENT_TYPE_FORM,
		"User-Agent": USER_AGENT,
	};
	const headers =
		referer === undefined
			? defaultHeaders
			: {...defaultHeaders, Referer: referer};
	const defaultInit = {headers: headers};
	const init =
		post === undefined
			? defaultInit
			: {...defaultInit, method: "POST", body: stringify(post)};
	await fetch(url, init);
};

const retrieve = async (
	url: string,
	referer?: string,
	post?: object,
	encoding: string = "UTF-8",
) =>
	new Promise<string>((resolve, reject) => {
		const request = new XMLHttpRequest();
		request.responseType = "arraybuffer";
		request.onload = () => {
			if (request.status === 200) {
				resolve(iconv.decode(Buffer.from(request.response), encoding));
			} else {
				reject(0);
			}
		};
		request.open(post === undefined ? "GET" : "POST", url);
		request.setRequestHeader("Content-type", CONTENT_TYPE_FORM);
		request.setRequestHeader("User-Agent", USER_AGENT);
		if (referer !== undefined) {
			request.setRequestHeader("Referer", referer);
		}
		request.send(post === undefined ? null : stringify(post));
	});

// TODO: cookies are nasty.
export const login = async (
	userId: string,
	password: string,
	remember: boolean,
): Promise<Auth> =>
	retrieve(DO_LOGIN_URL, LOGIN_URL, {
		auth_type: "local",
		username: userId,
		sms_code: "",
		password: password,
	})
		.then((str) => {
			if (str.indexOf("首页") === -1) {
				throw LoginStatus.Failed;
			}
		})
		.then(() =>
			connect(INFO_LOGIN_URL, INFO_URL, {
				redirect: "NO",
				userName: userId,
				password: password,
				x: "0",
				y: "0",
			}),
		)
		.then(() => connect(INVALIDATE_ZHJW_URL, INFO_URL))
		.then(() => {
			return {
				userId: userId,
				password: password,
				remember: remember,
			};
		});

export const getFullName = async (): Promise<string> =>
	retrieve(PROFILE_URL, PROFILE_REFERER, undefined, "GBK").then((str) => {
		const key = "report1_3";
		const startIndex = str.indexOf(`"${key}"`); // In order to silence eslint.
		if (startIndex === -1) {
			throw 0;
		} else {
			return str.substring(startIndex + 12, str.indexOf("</td>", startIndex));
		}
	});
