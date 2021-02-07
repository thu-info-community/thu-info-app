import {CONTENT_TYPE_FORM, USER_AGENT} from "../constants/strings";
import {Buffer} from "buffer";
import iconv from "iconv-lite";
import fetch from "cross-fetch";

const cookies: {[key: string]: string} = {};

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
    const defaultInit = {headers: headers};
    const init =
        post === undefined
            ? defaultInit
            : {
                ...defaultInit,
                method: "POST",
                body: typeof post === "string" ? post : stringify(post),
            };
    let charset = "UTF-8";
    return await fetch(url, init)
        .then((res) => {
            res.headers.forEach((value, key) => {
                if (key === "set-cookie") {
                    const segment = value.split(";")[0];
                    const [item, val] = segment.split("=");
                    cookies[item] = val;
                }
            });
            const contentType = res.headers.get("Content-Type");
            if (contentType) {
                if (contentType.includes("application/octet-stream")) {
                    charset = "base64";
                } else {
                    /charset=(.*?);/.test(contentType + ";");
                    charset = RegExp.$1;
                }
            }
            return res.arrayBuffer();
        })
        .then((arrayBuffer) => iconv.decode(Buffer.from(arrayBuffer), charset));
};

export const connect = async (
    url: string,
    referer?: string,
    post?: object | string,
): Promise<string> => uFetch(url, referer, post);

export const retrieve = async (
    url: string,
    referer?: string,
    post?: object | string,
    timeout = 60000,
) => {
    const work = uFetch(url, referer, post);
    const abort = new Promise<string>((_, reject) => setTimeout(() => {
        // request.abort();
        reject(new Error("Network error: Timeout."));
    }, timeout));
    return Promise.race([work, abort]);
};
