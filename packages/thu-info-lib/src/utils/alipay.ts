import {arbitraryEncode, uFetch} from "./network";
import cheerio from "cheerio";
import {ALIPAY_URL_PREFIX, SEND_TO_ALIPAY_ACTION_URL} from "../constants/strings";

export const generalGetPayCode = async (location: string, referer: string) => {
    // Get pay id
    const $1 = await uFetch(location, referer).then(
        cheerio.load
    );
    const id = $1("input[name=id]").attr().value;
    const xxx = $1("#xxx2").attr().value;

    // Send pay request to alipay
    const $2 = await uFetch(
        SEND_TO_ALIPAY_ACTION_URL,
        location,
        { id, xxx },
    ).then(cheerio.load);
    const url = $2("form").attr().action;
    const form = $2("[name=biz_content]").attr().value;

    // Get pay code
    return uFetch(
        url + "&biz_content=" + arbitraryEncode(form, "GBK"),
        SEND_TO_ALIPAY_ACTION_URL,
    ).then((s) => {
        const qrCode = cheerio("input[name=qrCode]", s).attr().value;
        return qrCode.substring(qrCode.lastIndexOf("/") + 1);
    });
};

export const genAlipayUrl = (payCode: string) => ALIPAY_URL_PREFIX + payCode;
