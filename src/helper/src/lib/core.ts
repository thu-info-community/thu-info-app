import {
	CONFIRM_LOGIN_URL,
	CONTENT_TYPE_FORM,
	DO_LOGIN_URL,
	DORM_LOGIN_POST_MIDDLE,
	DORM_LOGIN_POST_PREFIX,
	DORM_LOGIN_POST_SUFFIX,
	DORM_LOGIN_URL_PREFIX,
	DORM_SCORE_REFERER,
	DORM_SCORE_URL,
	HOLE_USER_AGENT,
	ID_LOGIN_CHECK_URL,
	INFO_LOGIN_URL,
	INFO_ROOT_URL,
	INFO_URL,
	INVALIDATE_ZHJW_URL,
	LIBRARY_LOGIN_URL,
	LOGIN_URL,
	LOGOUT_URL,
	PRE_LOGIN_URL,
	PRE_ROAM_URL_PREFIX,
	PROFILE_REFERER,
	PROFILE_URL,
	USER_AGENT,
	WEB_VPN_ROOT_URL,
} from "../constants/strings";
import {Buffer} from "buffer";
import iconv from "iconv-lite";
import md5 from "md5";
import cheerio from "cheerio";
import {InfoHelper, MOCK} from "../index";
import {ValidTickets} from "../models/network";

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
 *
 * Visiting thuhole requires a special User-Agent value, and that's why an
 * additional param `hole` is required, false by default.
 */
export const connect = async (
	url: string,
	referer?: string,
	post?: object | string,
	hole: boolean = false,
): Promise<void> => {
	const defaultHeaders = {
		"Content-Type": CONTENT_TYPE_FORM,
		"User-Agent": hole ? HOLE_USER_AGENT : USER_AGENT,
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
 *
 * Visiting thuhole requires a special User-Agent value, and that's why an
 * additional param `hole` is required, false by default.
 */
export const retrieve = async (
	url: string,
	referer?: string,
	post?: object | string,
	encoding: string = "UTF-8",
	timeout: number = 0,
	hole: boolean = false,
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
		request.setRequestHeader("User-Agent", hole ? HOLE_USER_AGENT : USER_AGENT);
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
 */
export const login = async (
	helper: InfoHelper,
	userId: string,
	password: string,
): Promise<{
	userId: string;
	password: string;
}> => {
	if (userId === MOCK && password === MOCK) {
		return {userId: userId, password: password};
	}
	const rawResponse = await retrieve(DO_LOGIN_URL, LOGIN_URL, {
		auth_type: "local",
		username: userId,
		sms_code: "",
		password: password,
	});
	if (rawResponse.indexOf("个人信息") === -1) {
		const loginResponse = JSON.parse(rawResponse);
		if (!loginResponse.success) {
			switch (loginResponse.error) {
				case "NEED_CONFIRM":
					await connect(CONFIRM_LOGIN_URL, LOGIN_URL, "");
					break;
				default:
					throw new Error(loginResponse.message);
			}
		}
	}
	await connect(INFO_LOGIN_URL, INFO_URL, {
		redirect: "NO",
		userName: userId,
		password: password,
		x: "0",
		y: "0",
	});
	await connect(INVALIDATE_ZHJW_URL, INFO_URL);
	return {
		userId: userId,
		password: password,
	};
};

/**
 * Gets the user's full name.
 */
export const getFullName = async (helper: InfoHelper): Promise<string> =>
	helper.mocked()
		? "Somebody"
		: retrieve(PROFILE_URL, PROFILE_REFERER, undefined, "GBK").then((str) => {
				const key = "report1_3";
				const startIndex = str.indexOf(`"${key}"`); // In order to silence eslint.
				if (startIndex === -1) {
					throw 0;
				}
				return str.substring(startIndex + 12, str.indexOf("</td>", startIndex));
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  });

/**
 * Logs-out from WebVPN.
 */
export const logout = async (helper: InfoHelper): Promise<void> => {
	if (!helper.mocked()) {
		return connect(LOGOUT_URL);
	}
};

export const getTicket = async (helper: InfoHelper, target: ValidTickets) => {
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
		const userId = helper.userId;
		const appId = md5(userId + new Date().getTime());
		const url = DORM_LOGIN_URL_PREFIX + appId;
		const post =
			DORM_LOGIN_POST_PREFIX +
			userId +
			DORM_LOGIN_POST_MIDDLE +
			encodeURIComponent(helper.dormPassword || helper.password) +
			DORM_LOGIN_POST_SUFFIX;
		return connect(url, url, post)
			.then(() =>
				retrieve(DORM_SCORE_URL, DORM_SCORE_REFERER, undefined, "gb2312"),
			)
			.then((s) => {
				if (cheerio("#weixin_health_linechartCtrl1_Chart1", s).length !== 1) {
					throw "login to tsinghua home error";
				}
			});
	} else if (target === 5000) {
		await connect(LIBRARY_LOGIN_URL, undefined);
		const redirect = cheerio(
			"div.wrapper>a",
			await retrieve(ID_LOGIN_CHECK_URL, LIBRARY_LOGIN_URL, {
				i_user: helper.userId,
				i_pass: helper.password,
				i_captcha: "",
			}),
		).attr().href;
		return connect(redirect);
	} else {
		return connect(`${PRE_ROAM_URL_PREFIX}${target}`, PRE_LOGIN_URL);
	}
};

export const retryWrapper = async <R>(
	helper: InfoHelper,
	target: ValidTickets,
	operation: Promise<R>,
): Promise<R> => {
	for (let i = 0; i < 2; ++i) {
		try {
			return await operation;
		} catch {
			await getTicket(helper, target);
		}
		console.log(`Getting ticket ${target} failed (${i + 1}/2). Retrying.`);
	}
	return operation;
};

export const performGetTickets = (helper: InfoHelper) => {
	([792, 824, 2005, 5000] as ValidTickets[]).forEach((target) => {
		getTicket(helper, target)
			.then(() => console.log(`Ticket ${target} get.`))
			.catch(() => console.warn(`Getting ticket ${target} failed.`));
	});
};

export const getTickets = (helper: InfoHelper) => {
	if (helper.mocked()) {
		return;
	}
	performGetTickets(helper);
	getTicket(helper, -1)
		.then(() => console.log("Ticket -1 get."))
		.catch(() => console.warn("Getting ticket -1 failed."));
	setInterval(async () => {
		console.log("Keep alive start.");
		const verification = await retrieve(WEB_VPN_ROOT_URL, WEB_VPN_ROOT_URL);
		if (verification.indexOf("个人信息") === -1) {
			console.log("Lost connection with school website. Reconnecting...");
			const {userId, password} = helper;
			try {
				await login(helper, userId, password);
			} catch (e) {
				console.warn("Login failed!");
			}
		}
		performGetTickets(helper);
	}, 60000);
};
