import {Auth, LoginStatus} from "../redux/states/auth";
import {
	CONTENT_TYPE_FORM,
	DO_LOGIN_URL,
	DORM_LOGIN_POST_MIDDLE,
	DORM_LOGIN_POST_PREFIX,
	DORM_LOGIN_POST_SUFFIX,
	DORM_LOGIN_URL_PREFIX,
	INFO_LOGIN_URL,
	INFO_ROOT_URL,
	INFO_URL,
	INVALIDATE_ZHJW_URL,
	LOGIN_URL,
	LOGOUT_URL,
	PRE_LOGIN_URL,
	PRE_ROAM_URL_PREFIX,
	PROFILE_REFERER,
	PROFILE_URL,
	USER_AGENT,
} from "../constants/strings";
import {Buffer} from "buffer";
import iconv from "iconv-lite";
import md5 from "md5";
import {currState} from "../redux/store";
import {dormLoginStatus} from "../utils/dorm";

/**
 * Converts form data into url-encoded format.
 *
 * Note that the keys of the input form will **NOT** be encoded.
 */
export const stringify = (form: any) =>
	Object.keys(form)
		.map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(form[key])}`)
		.join("&");

// Since there are strange things with `fetch` regarding to encodings,
// two different implementations of network connection are provided.

/**
 * Makes a request to the given `url`, with a specified `referer` if provided.
 *
 * If param `post` is provided, the request will be a POST request with the
 * given post form. Otherwise, the request will be a GET request.
 */
export const connect = async (
	url: string,
	referer?: string,
	post?: object | string,
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
			: {
					...defaultInit,
					method: "POST",
					body: typeof post === "string" ? post : stringify(post),
					// eslint-disable-next-line no-mixed-spaces-and-tabs
			  };
	await fetch(url, init);
};

/**
 * Gets the response data from the given `url`, with a specified `referer` if
 * provided.
 *
 * If param `post` is provided, a post request with the given post form will
 * be sent. Otherwise, a GET request will be sent.
 *
 * The `encoding` and `timeout` are `UTF-8` and `0` respectively by default,
 * and can be set to other values with the corresponding params.
 */
export const retrieve = async (
	url: string,
	referer?: string,
	post?: object | string,
	encoding: string = "UTF-8",
	timeout: number = 0,
) =>
	new Promise<string>((resolve, reject) => {
		const request = new XMLHttpRequest();
		request.responseType = "arraybuffer";
		request.timeout = timeout;
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
		request.send(
			post === undefined
				? null
				: typeof post === "string"
				? post
				: stringify(post),
		);
	});

/**
 * Logs-in to WebVPN, INFO and ZHJW sequentially.
 *
 * @TODO cookies are nasty
 */
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

/**
 * Gets the user's full name.
 */
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

/**
 * Logs-out from WebVPN.
 */
export const logout = async (): Promise<void> => connect(LOGOUT_URL);

export const getTicket = async (target: number) => {
	if (target >= 0 && target <= 1000) {
		return retrieve(INFO_ROOT_URL, PRE_LOGIN_URL, undefined, "UTF-8", 800).then(
			(str) => {
				const lowerBound = str.indexOf(`name="9-${target}`);
				const url = str
					.substring(
						str.indexOf("src", lowerBound) + 5,
						str.indexOf(" id", lowerBound) - 1,
					)
					.replace(/amp;/g, "");
				return connect(url, INFO_ROOT_URL);
			},
		);
	} else if (target === -1) {
		const userId = currState().auth.userId;
		const appId = md5(userId + new Date().getTime());
		const url = DORM_LOGIN_URL_PREFIX + appId;
		const post =
			DORM_LOGIN_POST_PREFIX +
			userId +
			DORM_LOGIN_POST_MIDDLE +
			encodeURIComponent(
				currState().config.dormPassword || currState().auth.password,
			) +
			DORM_LOGIN_POST_SUFFIX;
		return retrieve(url, url, post, "gb2312").then((s) => {
			if (s.indexOf("当前用户认证信息") === -1) {
				dormLoginStatus.loggedIn = false;
				// TODO: solve the problem of once successful, fails every time
				throw "login to tsinghua home error";
			} else {
				dormLoginStatus.loggedIn = true;
			}
		});
	} else {
		return connect(`${PRE_ROAM_URL_PREFIX}${target}`, PRE_LOGIN_URL);
	}
};

export const retryWrapper = async <R>(
	target: number,
	operation: Promise<R>,
): Promise<R> => {
	for (let i = 0; i < 2; ++i) {
		try {
			return await operation;
		} catch {
			await getTicket(target);
		}
		console.log(`Getting ticket ${target} failed (${i + 1}/2). Retrying.`);
	}
	return operation;
};
