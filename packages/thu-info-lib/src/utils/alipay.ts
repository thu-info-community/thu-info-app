import {arbitraryEncode, uFetch} from "./network";
import cheerio from "cheerio";
import {ALIPAY_URL_PREFIX, SEND_TO_ALIPAY_ACTION_URL} from "../constants/strings";

export const generalGetPayCode = async (paymentHtml: string, encoding?: string) => {
    const $ = cheerio.load(paymentHtml);
    const url = $("form").attr().action;
    const form = $("[name=biz_content]").attr().value;

    // Get pay code
    return uFetch(
        url + "&biz_content=" + arbitraryEncode(form, encoding),
        SEND_TO_ALIPAY_ACTION_URL,
    ).then((s) => {
        const qrCode = cheerio("input[name=qrCode]", s).attr().value;
        return qrCode.substring(qrCode.lastIndexOf("/") + 1);
    });
};

export const genAlipayUrl = (payCode: string) => ALIPAY_URL_PREFIX + payCode;
