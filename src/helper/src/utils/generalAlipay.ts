import {retrieve} from "../lib/core";
import cheerio from "cheerio";
import {
	QING_HUA_XUE_SHENG_ZI_JING_DIAN_BIAO_GBK,
	QING_HUA_XUE_SHENG_ZI_JING_DIAN_BIAO_UTF8,
	SEND_TO_ALIPAY_ACTION_URL,
} from "../constants/strings";

export const generalGetPayCode = async (location: string, referer: string) => {
	// Get pay id
	const $1 = await retrieve(location, referer, undefined, "GBK").then(
		cheerio.load,
	);
	const id = $1("input[name=id]").attr().value;
	const xxx = $1("#xxx2").attr().value;

	// Send pay request to alipay
	const $2 = await retrieve(
		SEND_TO_ALIPAY_ACTION_URL,
		location,
		{id, xxx},
		"GBK",
	).then(cheerio.load);
	const url = $2("form").attr().action;
	const form = $2("[name=biz_content]").attr().value;

	// Get pay code
	return retrieve(
		url +
			"&biz_content=" +
			encodeURIComponent(form).replace(
				QING_HUA_XUE_SHENG_ZI_JING_DIAN_BIAO_UTF8,
				QING_HUA_XUE_SHENG_ZI_JING_DIAN_BIAO_GBK,
			),
		SEND_TO_ALIPAY_ACTION_URL,
		undefined,
		"GBK",
	).then((s) => {
		const qrCode = cheerio("input[name=qrCode]", s).attr().value;
		return qrCode.substring(qrCode.lastIndexOf("/") + 1);
	});
};
