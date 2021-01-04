import {retrieve} from "./core";
import cheerio from "cheerio";
import {
	BGTZ_MAIN_PREFIX,
	HB_MAIN_PREFIX,
	JWGG_MAIN_PREFIX,
} from "../constants/strings";
import {
	newsHtml,
	url0,
	url1,
	url2,
	url3,
	url4,
	url5,
	url6,
	url7,
	url8,
	url9,
} from "../mocks/news/newsHtml";
import {newsSlice, sourceTag} from "../models/news/news";
import {InfoHelper} from "../index";
import {getCheerioText} from "../utils/cheerio";

export const getNewsList = (
	helper: InfoHelper,
	url: string,
	channel: sourceTag,
): Promise<newsSlice[]> => {
	if (helper.mocked()) {
		switch (url) {
			case JWGG_MAIN_PREFIX + 0:
				return Promise.resolve([
					{
						channel: "JWGG",
						date: "2020.09.16",
						name: "博士生思政课“中国马克思主义与当代”扩容通知",
						source: "研究生院",
						url: url0,
					},
					{
						channel: "JWGG",
						date: "2020.09.14",
						name: "研究生补退选时间安排（2020-2021秋）",
						source: "教务处",
						url: url1,
					},
					{
						channel: "JWGG",
						date: "2020.09.14",
						name: "本科生补退选时间安排（2020-2021秋）",
						source: "教务处",
						url: url2,
					},
					{
						channel: "JWGG",
						date: "2020.09.14",
						name: "2020-2021学年秋季学期SRT立项通知",
						source: "教务处",
						url: url3,
					},
				]);
			case BGTZ_MAIN_PREFIX + 0:
				return Promise.resolve([
					{
						channel: "BGTZ",
						date: "2020.09.17",
						name: "第二十二届清华大学创业大赛参赛报名通知",
						source: "校团委",
						url: url4,
					},
					{
						channel: "BGTZ",
						date: "2020.09.17",
						name: "清华大学“启·创”学生创业人才培育计划八期公开招募通知",
						source: "校团委",
						url: url5,
					},
					{
						channel: "BGTZ",
						date: "2020.09.17",
						name: "关于召开2020年度人事工作会的通知",
						source: "人事处",
						url: url6,
					},
				]);
			case HB_MAIN_PREFIX + 0:
				return Promise.resolve([
					{
						channel: "HB",
						date: "2020.09.17",
						name: "2020年10月三场“LIVE 逍遥夜”演出开票公告",
						source: "艺教中心办公室",
						url: url7,
					},
					{
						channel: "HB",
						date: "2020.09.15",
						name:
							"清华大学“唯真讲坛”系列在线理论宣讲活动第二十讲 当前的国际形势与热点问题",
						source: "党委宣传部",
						url: url8,
					},
					{
						channel: "HB",
						date: "2020.09.14",
						name:
							"金融科技还是科技金融？——数字刀如何切开金融蛋糕|清华五道口云课堂之金融大家评·华尔街热线（第15期）",
						source: "五道口金融学院综合办公室",
						url: url9,
					},
				]);
			default:
				return Promise.resolve([]);
		}
	}
	return retrieve(url).then((str) => {
		const $ = cheerio.load(str);
		let newsList: newsSlice[] = [];
		$("ul.cont_list > li", str).each((_, item) => {
			if (item.type === "tag" && item.children[3].type === "tag") {
				let newsUrl: string = item.children[3].attribs.href;
				if (newsUrl[0] === "/") {
					newsUrl = "https://webvpn.tsinghua.edu.cn" + newsUrl;
				}
				newsList.push(
					new newsSlice(
						getCheerioText(item, 3),
						newsUrl,
						getCheerioText(item, 7),
						item.children[4].data?.substr(
							3,
							item.children[4].data?.length - 5,
						) ?? "",
						channel,
					),
				);
			}
		});
		return newsList;
	});
};

const policyList: [string, [string, string, string]][] = [
	["jwcbg", ["GBK", ".TD4", "td[colspan=4]:not(td[height])"]],
	[
		"kybg",
		["GBK", ".style1", "table[width='95%'][cellpadding='3'] tr:nth-child(3)"],
	],
	["gjc", ["GBK", ".style11", "[width='85%'] td"]],
	[
		"77726476706e69737468656265737421f2fa598421322653770bc7b88b5c2d32530b094045c3bd5cabf3",
		["GBK", ".TD1", "td[colspan=4]:not(td[height])"],
	],
	[
		"77726476706e69737468656265737421e0f852882e3e6e5f301c9aa596522b2043f84ba24ebecaf8",
		["UTF-8", ".cont_doc_box h5 span", "div.field-item"],
	],
	[
		"77726476706e69737468656265737421e9fd528569336153301c9aa596522b20735d12f268e561f0",
		[
			"GBK",
			"h3",
			"[style='text-align:left; width:90%; magin:0px auto; padding-top:20px;  padding-bottom:20px;word-break:break-all;']",
		],
	],
	[
		"77726476706e69737468656265737421f8e60f8834396657761d88e29d51367b523e",
		["GBK", "h1", ".r_cont > ul"],
	],
	[
		"77726476706e69737468656265737421e8ef439b69336153301c9aa596522b20e1a870705b76e399",
		["GBK", "", ".td4"],
	],
	["rscbg", ["GBK", "[height=40]", "[width='95%'] > tr:nth-child(3)"]],
	[
		"77726476706e69737468656265737421e7e056d234297b437c0bc7b88b5c2d3212b31e4d37621d4714d6",
		["GBK", "", "[style='text-align:left']"],
	],
	["ghxt", ["GBK", "", "[valign=top]:not([class])"]],
	[
		"fgc",
		[
			"GBK",
			".title_b",
			"[style='width:647px;margin-left:6px;font-size:13px;line-height:20px;text-align:justify']",
		],
	],
];

const getNewsDetailPolicy = (
	url: string,
): [string, string | undefined, string | undefined] => {
	for (let i = 0; i < policyList.length; ++i) {
		if (url.indexOf(policyList[i][0]) !== -1) {
			return policyList[i][1];
		}
	}
	return ["UTF-8", undefined, undefined];
};

export const getNewsDetail = async (
	helper: InfoHelper,
	url: string,
): Promise<[string, string, string]> => {
	const [encoding, title, content] = getNewsDetailPolicy(url);
	const html = helper.mocked()
		? newsHtml[url] ?? ""
		: await retrieve(url, undefined, undefined, encoding);
	if (title !== undefined && content) {
		const r = cheerio(content, html);
		return [
			cheerio(title, html).text(),
			r.html() ?? "",
			r.text().replace(/\s/g, ""),
		];
	} else {
		return ["", html, ""];
	}
};
