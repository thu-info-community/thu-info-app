import {connect, retrieve, retryWrapper} from "./core";
import {
	DORM_SCORE_HOST,
	DORM_SCORE_REFERER,
	DORM_SCORE_URL,
	ELE_PAY_RECORD_URL,
	RECHARGE_ELE_REFERER,
	RECHARGE_ELE_URL,
	RECHARGE_PAY_ELE_POST_MIDDLE_A,
	RECHARGE_PAY_ELE_POST_MIDDLE_B,
	RECHARGE_PAY_ELE_POST_PREFIX,
	RECHARGE_PAY_ELE_POST_SUFFIX,
	RECHARGE_PAY_ELE_URL,
	TSINGHUA_HOME_LOGIN_POST_MIDDLE,
	TSINGHUA_HOME_LOGIN_POST_PREFIX,
	TSINGHUA_HOME_LOGIN_POST_SUFFIX,
	TSINGHUA_HOME_LOGIN_URL,
} from "../constants/strings";
import cheerio from "cheerio";
import {generalGetPayCode} from "../utils/generalAlipay";
import {getCheerioText} from "../utils/cheerio";
import {InfoHelper} from "../index";
type Cheerio = ReturnType<typeof cheerio>;
type Element = Cheerio[number];
type TagElement = Element & {type: "tag"};

const loginToHome = async (helper: InfoHelper) => {
	const validChars = new Set(
		"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz =+-/_()<>,.'`~",
	);
	// TODO: these valid chars might be far from enough
	const {userId} = helper;
	const password = helper.dormPassword || helper.password;
	let tempPassword = "";
	for (let i = 0; i < password.length; i++) {
		if (validChars.has(password.charAt(i))) {
			tempPassword += password.charAt(i);
		}
	}
	await connect(
		TSINGHUA_HOME_LOGIN_URL,
		undefined,
		TSINGHUA_HOME_LOGIN_POST_PREFIX +
			userId +
			TSINGHUA_HOME_LOGIN_POST_MIDDLE +
			encodeURIComponent(tempPassword) +
			TSINGHUA_HOME_LOGIN_POST_SUFFIX,
	);
};

export const getDormScore = (helper: InfoHelper): Promise<string> =>
	helper.mocked()
		? Promise.resolve(
				"https://cloud.tsinghua.edu.cn/f/43ada07f3731439daf06/?dl=1",
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  )
		: retryWrapper(
				helper,
				-1,
				retrieve(DORM_SCORE_URL, DORM_SCORE_REFERER, undefined, "gb2312").then(
					(s) =>
						DORM_SCORE_HOST +
						cheerio("#weixin_health_linechartCtrl1_Chart1", s).attr().src,
				),
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  );

export const getEleRechargePayCode = async (
	helper: InfoHelper,
	money: number,
): Promise<string> => {
	await loginToHome(helper);

	const $ = await retrieve(
		RECHARGE_ELE_URL,
		RECHARGE_ELE_REFERER,
		undefined,
		"gb2312",
	).then(cheerio.load);

	const username = $("input[name=username]").attr().value;
	const louhao = $("input[name=louhao]").attr().value;

	const redirect = await retrieve(
		RECHARGE_PAY_ELE_URL,
		RECHARGE_ELE_URL,
		RECHARGE_PAY_ELE_POST_PREFIX +
			money +
			RECHARGE_PAY_ELE_POST_MIDDLE_A +
			encodeURIComponent(username) +
			RECHARGE_PAY_ELE_POST_MIDDLE_B +
			encodeURIComponent(louhao) +
			RECHARGE_PAY_ELE_POST_SUFFIX,
	).then((s) => cheerio("#banksubmit", s).attr().action);

	return generalGetPayCode(redirect, RECHARGE_PAY_ELE_URL);
};

export const getElePayRecord = async (
	helper: InfoHelper,
): Promise<[string, string, string, string, string, string][]> => {
	if (helper.mocked()) {
		return [
			["", "0", "2020-09-15 11:24:07", "", "10.00", "已成功"],
			["", "1", "2020-09-06 17:38:57", "", "5.00", "已成功"],
			["", "2", "2020-09-03 15:47:29", "", "20.00", "已成功"],
			["", "3", "2020-08-30 09:17:38", "", "1.00", "已成功"],
			["", "4", "2020-08-30 09:14:36", "", "4.00", "已成功"],
			["", "5", "2020-08-24 11:43:00", "", "10.00", "已成功"],
			["", "6", "2020-08-22 23:12:49", "", "5.00", "已成功"],
		];
	}
	await loginToHome(helper);
	const $ = await retrieve(
		ELE_PAY_RECORD_URL,
		RECHARGE_ELE_URL,
		undefined,
		"gb2312",
	).then(cheerio.load);

	return $(".myTable")
		.first()
		.children()
		.slice(1)
		.map((index, element) => [
			(element as TagElement).children
				.filter((it) => it.type === "tag" && it.tagName === "td")
				.map((it) => getCheerioText(it, 1)),
		])
		.get();
};
