import {Auth} from "../redux/states/auth";
import {
	ACADEMIC_HOME_URL,
	ACADEMIC_LOGIN_URL,
	ACADEMIC_URL,
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
import {currState, mocked, store} from "../redux/store";
import cheerio from "cheerio";
import {NetworkRetry} from "../components/easySnackbars";
import {SET_GRADUATE} from "../redux/constants";

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
				reject(`Network error: response status = ${request.status}`);
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

const loginInfo = async (userId: string, password: string) => {
	const response = await retrieve(
		INFO_LOGIN_URL,
		INFO_URL,
		{
			redirect: "NO",
			userName: userId,
			password: password,
			x: "0",
			y: "0",
		},
		"GBK",
	);
	if (!response.includes("清华大学信息门户")) {
		throw new Error("Failed to login to INFO.");
	}
};

const loginAcademic = async (
	userId: string,
	password: string,
	graduate: boolean,
) => {
	const responseA = await retrieve(
		ACADEMIC_LOGIN_URL,
		ACADEMIC_URL,
		{
			userName: userId,
			password,
		},
		"GBK",
	);
	if (!responseA.includes("清华大学信息门户")) {
		throw new Error("Failed to login to Academic (step 1).");
	}

	const MAX_ATTEMPT = 3;
	for (let i = 0; i < MAX_ATTEMPT; ++i) {
		const iFrameUrl = cheerio(
			graduate ? "#23-2604_iframe" : "#25-2649_iframe",
			await retrieve(ACADEMIC_HOME_URL, ACADEMIC_URL),
		).attr().src;
		const responseB = await retrieve(
			iFrameUrl,
			ACADEMIC_HOME_URL,
			undefined,
			"GBK",
		);
		if (responseB.includes("清华大学教学门户")) {
			return;
		}
	}
	throw new Error(
		`Failed to login to Academic after ${MAX_ATTEMPT} attempts. (step 2).`,
	);
};

/**
 * Logs-in to WebVPN, INFO and academic.
 */
export const login = async (
	userId: string,
	password: string,
): Promise<Auth> => {
	if (mocked()) {
		return {userId: userId, password: password};
	}
	const graduate = userId[4] === "2" || userId[4] === "3";
	store.dispatch({type: SET_GRADUATE, payload: graduate});
	const loginResponse = await retrieve(DO_LOGIN_URL, LOGIN_URL, {
		auth_type: "local",
		username: userId,
		sms_code: "",
		password: password,
	}).then(JSON.parse);
	if (!loginResponse.success) {
		switch (loginResponse.error) {
			case "NEED_CONFIRM":
				await connect(CONFIRM_LOGIN_URL, LOGIN_URL, "");
				break;
			default:
				throw new Error(loginResponse.message);
		}
	}
	await Promise.all([
		loginInfo(userId, password),
		loginAcademic(userId, password, graduate),
	]);
	return {
		userId: userId,
		password: password,
	};
};

/**
 * Gets the user's full name.
 */
export const getFullName = async (): Promise<string> =>
	mocked()
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
export const logout = async (): Promise<void> => {
	if (!mocked()) {
		return connect(LOGOUT_URL);
	}
};

type ValidTickets = -1 | 792 | 824 | 2005 | 5000; // -1 for tsinghua home, 5000 for library

export const getTicket = async (target: ValidTickets) => {
	if (target >= 0 && target <= 1000) {
		return retrieve(
			INFO_ROOT_URL,
			PRE_LOGIN_URL,
			undefined,
			"UTF-8",
			800,
		).then((str) =>
			connect(cheerio(`#9-${target}_iframe`, str).attr().src, INFO_ROOT_URL),
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
				currState().credentials.dormPassword || currState().auth.password,
			) +
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
				i_user: currState().auth.userId,
				i_pass: currState().auth.password,
				i_captcha: "",
			}),
		).attr().href;
		return connect(redirect);
	} else {
		return connect(`${PRE_ROAM_URL_PREFIX}${target}`, PRE_LOGIN_URL);
	}
};

export const retryWrapper = async <R>(
	target: ValidTickets,
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

export const performGetTickets = () => {
	([792, 824, 2005, 5000] as ValidTickets[]).forEach((target) => {
		getTicket(target)
			.then(() => console.log(`Ticket ${target} get.`))
			.catch(() => console.warn(`Getting ticket ${target} failed.`));
	});
};

export const getTickets = () => {
	if (mocked()) {
		return;
	}
	performGetTickets();
	getTicket(-1)
		.then(() => console.log("Ticket -1 get."))
		.catch(() => console.warn("Getting ticket -1 failed."));
	setInterval(async () => {
		console.log("Keep alive start.");
		const verification = await retrieve(WEB_VPN_ROOT_URL, WEB_VPN_ROOT_URL);
		if (!verification.includes("个人信息")) {
			console.log("Lost connection with school website. Reconnecting...");
			const {userId, password} = currState().auth;
			try {
				await login(userId, password);
			} catch (e) {
				NetworkRetry();
			}
		}
		performGetTickets();
	}, 60000);
};
