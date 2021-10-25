import {CONTENT_TYPE_FORM, USER_AGENT} from "../constants/strings";
import iconv from "iconv-lite";
import fetch from "cross-fetch";
import AbortController from "abort-controller";

/**
 * The values that are valid as ticket numbers.
 * See wiki for more information.
 */
export type ValidTickets = -1 | -2 | 792 | 824 | 2005 | 5000 | 5001 | 424; // -1 and -2 for tsinghua home, 5000 for library, 5001 for library booking, 424 for sports

export const cookies: {[key: string]: string} = {};

/**
 * Clear the cookies.
 */
export const clearCookies = () => {
    Object.keys(cookies).forEach((key) => delete cookies[key]);
};

/**
 * An enhanced implementation of `encodeURIComponent`, which supports
 * arbitrary charset.
 */
export const arbitraryEncode = (s: string, encoding = "UTF-8") =>
    encoding === "UTF-8" ? encodeURIComponent(s) : String(s)
        .split("")
        .map((ch) => RegExp(/^[\u4e00-\u9fa5]*$/).test(ch)
            ? iconv.encode(ch, encoding).reduce((a: string, b: number) => a + "%" + b.toString(16), "")
            : ch,
        )
        .join("");

/**
 * Converts form data into url-encoded format (utf-8).
 */
export const stringify = (form: any, paramEncoding = "UTF-8") =>
    Object.keys(form)
        .map((key) => `${arbitraryEncode(key, paramEncoding)}=${arbitraryEncode(form[key], paramEncoding)}`)
        .join("&");

/**
 * Gets the response data from the given `url`, with a specified `referer` if
 * provided.
 *
 * If param `post` is provided, a `POST` request with the given post form will
 * be sent. Otherwise, a `GET` request will be sent.
 *
 * The `timeout` is `60000` by default, in milliseconds.
 *
 * The `paramEncoding` is `UTF-8` by default, used to encode post form params.
 *
 * If `serialized` is `true`, the method will treat `post` as a string that has
 * already been serialized.
 */
export const uFetch = async (
    url: string,
    referer?: string,
    post?: object,
    timeout = 60000,
    paramEncoding = "UTF-8",
    serialized = false,
): Promise<string> => {
    // Prepare request headers
    const defaultHeaders = {
        // Setup content-type and user-agent
        "Content-Type": CONTENT_TYPE_FORM,
        "User-Agent": USER_AGENT,
    };

    const headersWithCookies = global.FileReader === undefined ? {
        ...defaultHeaders,
        // Cookie should be manually set in Node.js
        Cookie: Object.keys(cookies).map((key) => `${key}=${cookies[key]}`).join(";"),
    } : defaultHeaders;

    // Add referer to header if specified
    const headers =
        referer === undefined
            ? headersWithCookies
            : {...headersWithCookies, Referer: referer};

    // Handle timeout abortion
    const controller = new AbortController();
    const timeoutEvent = setTimeout(() => {
        controller.abort();
    }, timeout);
    const defaultInit = {
        headers: headers,
        signal: controller.signal,
    };

    // Switch method to `POST` if post-body is provided
    const init =
        post === undefined
            ? defaultInit
            : {
                ...defaultInit,
                method: "POST",
                body: serialized? (post as never as string) : stringify(post, paramEncoding),
            };

    // Perform the network request
    try {
        const response = await fetch(url, init);

        // Manage cookies
        response.headers.forEach((value, key) => {
            if (key === "set-cookie") {
                const segment = value.split(";")[0];
                const [item, val] = segment.split("=");
                cookies[item] = val;
            }
        });

        // Detect charset based on content-type
        const contentType = response.headers.get("Content-Type");
        let base64 = false;
        let charset = "UTF-8";
        if (contentType) {
            if (contentType.includes("application/octet-stream")) {
                base64 = true;
            } else {
                /charset=(.*?);/.test(contentType + ";");
                charset = RegExp.$1;
            }
        }

        if (global.FileReader) {
            // For browser and react-native
            const blob = await response.blob();
            return await new Promise<string>(((resolve, reject) => {
                // Use FileReader to read blob data
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (typeof reader.result === "string") {
                        if (base64) {
                            // Simply return the string data with the MIME header removed
                            resolve(reader.result.substr("data:application/octet-stream;base64,".length));
                        } else {
                            // The value stored in `reader.result` has already been parsed with the correct encoding
                            resolve(reader.result);
                        }
                    } else {
                        // This should not happen
                        reject(new Error("Blob parsing error."));
                    }
                };
                // Read and transform
                if (base64) {
                    reader.readAsDataURL(blob);
                } else {
                    reader.readAsText(blob, charset);
                }
            }));
        } else {
            // For node.js
            const arrayBuffer = await response.arrayBuffer();
            // Use iconv-lite to transform arrayBuffer into string
            return iconv.decode(Buffer.from(arrayBuffer), charset);
        }
    } finally {
        // We have to clear the timeout
        clearTimeout(timeoutEvent);
    }
};
