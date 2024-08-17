import {uFetch} from "./network";
import * as cheerio from "cheerio";

export const generalGetPayCode = async (paymentHtml: string) => {
    const $ = cheerio.load(paymentHtml);
    const url = $("form").attr()!.action;
    const form = $("[name=biz_content]").attr()!.value;

    // Get pay code
    return uFetch(url, {biz_content: form}).then((s) => {
        const qrCode = cheerio.load(s)("input[name=qrCode]").attr()!.value;
        return qrCode.substring(qrCode.lastIndexOf("/") + 1);
    });
};
