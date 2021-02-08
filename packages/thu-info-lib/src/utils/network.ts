import {CONTENT_TYPE_FORM, USER_AGENT} from "../constants/strings";
import {Buffer} from "buffer";
import iconv from "iconv-lite";
import fetch from "cross-fetch";
import AbortController from "abort-controller";

export type ValidTickets = -1 | 792 | 824 | 2005 | 5000; // -1 for tsinghua home, 5000 for library

const cookies: {[key: string]: string} = {};

export const arbitraryEncode = (s: string, encoding = "UTF-8") =>
    s
        .split("")
        .map((ch) => RegExp(/^[\u4e00-\u9fa5]*$/).test(ch)
            ? iconv.encode(ch, encoding).reduce((a: string, b: number) => a + "%" + b.toString(16), "")
            : ch,
        )
        .join("");

/**
 * Converts form data into url-encoded format.
 */
export const stringify = (form: any) =>
    Object.keys(form)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(form[key])}`)
        .join("&");

/**
 * Gets the response data from the given `url`, with a specified `referer` if
 * provided.
 *
 * If param `post` is provided, a post request with the given post form will
 * be sent. Otherwise, a GET request will be sent.
 *
 * The `encoding` and `timeout` are `UTF-8` and `60000` respectively by default,
 * and can be set to other values with the corresponding params.
 */
export const uFetch = async (
    url: string,
    referer?: string,
    post?: object | string,
    timeout = 60000,
): Promise<string> => {
    const defaultHeaders = {
        "Content-Type": CONTENT_TYPE_FORM,
        "User-Agent": USER_AGENT,
        "Cookie": Object.keys(cookies).map((key) => `${key}=${cookies[key]}`).join(";"),
    };
    const headers =
        referer === undefined
            ? defaultHeaders
            : {...defaultHeaders, Referer: referer};
    const controller = new AbortController();
    const timeoutEvent = setTimeout(() => {
        controller.abort();
    }, timeout);
    const defaultInit = {
        headers: headers,
        signal: controller.signal,
    };
    const init =
        post === undefined
            ? defaultInit
            : {
                ...defaultInit,
                method: "POST",
                body: typeof post === "string" ? post : stringify(post),
            };
    let charset = "UTF-8";
    try {
        const response = await fetch(url, init);
        response.headers.forEach((value, key) => {
            if (key === "set-cookie") {
                const segment = value.split(";")[0];
                const [item, val] = segment.split("=");
                cookies[item] = val;
            }
        });
        const contentType = response.headers.get("Content-Type");
        if (contentType) {
            if (contentType.includes("application/octet-stream")) {
                charset = "base64";
            } else {
                /charset=(.*?);/.test(contentType + ";");
                charset = RegExp.$1;
            }
        }
        const arrayBuffer = await response.arrayBuffer();
        return iconv.decode(Buffer.from(arrayBuffer), charset);
    } finally {
        clearTimeout(timeoutEvent);
    }
};
