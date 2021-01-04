import {
	CONTENT_TYPE_FORM,
	HOLE_USER_AGENT,
	USER_AGENT,
} from "../constants/strings";
import iconv from "iconv-lite";
import {Buffer} from "buffer";

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
	hole = false,
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
	encoding = "UTF-8",
	timeout = 0,
	hole = false,
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
