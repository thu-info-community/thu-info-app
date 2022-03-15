import {arbitraryEncode, uFetch} from "./network";
import cheerio from "cheerio";
import {ALIPAY_URL_PREFIX} from "../constants/strings";

export const generalGetPayCode = async (paymentHtml: string, encoding?: string) => {
    const $ = cheerio.load(paymentHtml);
    const url = $("form").attr().action;
    const form = $("[name=biz_content]").attr().value;

    // Get pay code
    return uFetch(url, {biz_content: form}).then((s) => {
        const qrCode = cheerio("input[name=qrCode]", s).attr().value;
        return qrCode.substring(qrCode.lastIndexOf("/") + 1);
    });
};

export const genAlipayUrl = (payCode: string) => ALIPAY_URL_PREFIX + payCode;
