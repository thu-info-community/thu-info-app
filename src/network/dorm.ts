import {connect, retrieve, retryWrapper} from "./core";
import {
	DORM_SCORE_HOST,
	DORM_SCORE_REFERER,
	DORM_SCORE_URL,
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
import {currState} from "../redux/store";
import {generalGetPayCode} from "../utils/generalAlipay";

export const getDormScore = (): Promise<string> =>
	retryWrapper(
		-1,
		retrieve(DORM_SCORE_URL, DORM_SCORE_REFERER, undefined, "gb2312").then(
			(s) =>
				DORM_SCORE_HOST +
				cheerio("#weixin_health_linechartCtrl1_Chart1", s).attr().src,
		),
	);

export const getEleRechargePayCode = async (money: number): Promise<string> => {
	const validChars = new Set(
		"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz =+-/_()<>,.'`~",
	);
	// TODO: these valid chars might be far from enough
	const {userId} = currState().auth;
	const password = currState().config.dormPassword || currState().auth.password;
	let tempPassword = "";
	for (let i = 0; i < password.length; i++) {
		if (validChars.has(password.charAt(i))) {
			tempPassword += password.charAt(i);
		}
	}

	// Login to tsinghua home website
	await connect(
		TSINGHUA_HOME_LOGIN_URL,
		undefined,
		TSINGHUA_HOME_LOGIN_POST_PREFIX +
			userId +
			TSINGHUA_HOME_LOGIN_POST_MIDDLE +
			encodeURIComponent(tempPassword) +
			TSINGHUA_HOME_LOGIN_POST_SUFFIX,
	);

	// Get necessary form data
	const $ = await retrieve(
		RECHARGE_ELE_URL,
		RECHARGE_ELE_REFERER,
		undefined,
		"gb2312",
	).then(cheerio.load);

	const username = $("input[name=username]").attr().value;
	const louhao = $("input[name=louhao]").attr().value;

	// Send pay request to tsinghua
	const redirect = await retrieve(
		RECHARGE_PAY_ELE_URL,
		RECHARGE_ELE_URL,
		RECHARGE_PAY_ELE_POST_PREFIX +
			money +
			RECHARGE_PAY_ELE_POST_MIDDLE_A +
			username +
			RECHARGE_PAY_ELE_POST_MIDDLE_B +
			louhao +
			RECHARGE_PAY_ELE_POST_SUFFIX,
	).then((s) => cheerio("#banksubmit", s).attr().action);

	return generalGetPayCode(redirect, RECHARGE_PAY_ELE_URL);
};
