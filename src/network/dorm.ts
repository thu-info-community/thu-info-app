import {retrieve, retryWrapper} from "./core";
import {
	DORM_SCORE_HOST,
	DORM_SCORE_REFERER,
	DORM_SCORE_URL,
} from "../constants/strings";
import cheerio from "cheerio";

export const getDormScore = (): Promise<string> =>
	retryWrapper(
		-1,
		retrieve(DORM_SCORE_URL, DORM_SCORE_REFERER, undefined, "gb2312").then(
			(s) =>
				DORM_SCORE_HOST +
				cheerio("#weixin_health_linechartCtrl1_Chart1", s).attr().src,
		),
	);
