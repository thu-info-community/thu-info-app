import fetch from "node-fetch";
import {CONTENT_TYPE_FORM, USER_AGENT} from "../../constants/strings";
import iconv from "iconv-lite";
import {Buffer} from "buffer";

const cookies: {[key: string]: string} = {};

export const stringify = (form: any) =>
    Object.keys(form)
        .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(form[key])}`)
        .join("&");

export const retrieve = async (
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
            res.headers.raw()["set-cookie"]?.forEach((cookie) => {
                const segment = cookie.split(";")[0];
                const [key, val] = segment.split("=");
                cookies[key] = val;
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
    post?: object | string
): Promise<void> => {
    await retrieve(url, referer, post);
};
