import {retrieve} from "./core";
import cheerio from "cheerio";
import {getCheerioText} from "src/utils/cheerio";
import {mocked} from "../redux/store";
import {
	BGTZ_MAIN_PREFIX,
	HB_MAIN_PREFIX,
	JWGG_MAIN_PREFIX,
	KYTZ_MAIN_PREFIX,
} from "../constants/strings";
import {newsHtml, url0, url1} from "../assets/htmls/newsHtml";

export type sourceTag = "JWGG" | "KYTZ" | "BGTZ" | "HB";

export class newsSlice {
	constructor(
		readonly name: string,
		readonly url: string,
		readonly date: string,
		readonly source: string,
		readonly channel: sourceTag,
	) {}
}

export const getNewsList = (
	url: string,
	channel: sourceTag,
): Promise<newsSlice[]> => {
	if (mocked()) {
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
						name: "2020~2021学年秋季学期第一批新开本科生课程征求意见",
						source: "教务处",
						url: url1,
					},
					{
						channel: "JWGG",
						date: "2020.09.14",
						name: "研究生补退选时间安排（2020-2021秋）",
						source: "教务处",
						url:
							"https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fae0429e207e6b597d469dbf915b243d8ae9128e1cdcffb247/jwcbg/detail_cat.jsp?boardid=57&seq=7632",
					},
					{
						channel: "JWGG",
						date: "2020.09.14",
						name: "本科生补退选时间安排（2020-2021秋）",
						source: "教务处",
						url:
							"https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fae0429e207e6b597d469dbf915b243d8ae9128e1cdcffb247/jwcbg/detail_cat.jsp?boardid=57&seq=7631",
					},
					{
						channel: "JWGG",
						date: "2020.09.14",
						name: "2020-2021学年秋季学期SRT立项通知",
						source: "教务处",
						url:
							"https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fae0429e207e6b597d469dbf915b243d8ae9128e1cdcffb247/jwcbg/detail_cat.jsp?boardid=57&seq=7627",
					},
				]);
			case BGTZ_MAIN_PREFIX + 0:
				return Promise.resolve([
					{
						channel: "BGTZ",
						date: "2020.09.17",
						name: "第二十二届清华大学创业大赛参赛报名通知",
						source: "校团委",
						url:
							"https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f2fa598421322653770bc7b88b5c2d32530b094045c3bd5cabf3/boarddetail_cat.jsp?columnId=xtw01&itemSeq=124715",
					},
					{
						channel: "BGTZ",
						date: "2020.09.17",
						name: "清华大学“启·创”学生创业人才培育计划八期公开招募通知",
						source: "校团委",
						url:
							"https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f2fa598421322653770bc7b88b5c2d32530b094045c3bd5cabf3/boarddetail_cat.jsp?columnId=xtw01&itemSeq=124712",
					},
					{
						channel: "BGTZ",
						date: "2020.09.17",
						name: "关于召开2020年度人事工作会的通知",
						source: "人事处",
						url:
							"https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421e2e442d23323615e79009cadd650272001f8dd/rscbg/detail.jsp?boardid=22&seq=5182",
					},
				]);
			case HB_MAIN_PREFIX + 0:
				return Promise.resolve([
					{
						channel: "HB",
						date: "2020.09.17",
						name: "2020年10月三场“LIVE 逍遥夜”演出开票公告",
						source: "艺教中心办公室",
						url:
							"https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421e0f852882e3e6e5f301c9aa596522b2043f84ba24ebecaf8/node/279771",
					},
					{
						channel: "HB",
						date: "2020.09.15",
						name:
							"清华大学“唯真讲坛”系列在线理论宣讲活动第二十讲 当前的国际形势与热点问题",
						source: "党委宣传部",
						url:
							"https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421f2fa598421322653770bc7b88b5c2d32530b094045c3bd5cabf3/boarddetail_cat.jsp?columnId=dwxcb01&itemSeq=124530",
					},
					{
						channel: "HB",
						date: "2020.09.14",
						name:
							"金融科技还是科技金融？——数字刀如何切开金融蛋糕|清华五道口云课堂之金融大家评·华尔街热线（第15期）",
						source: "五道口金融学院综合办公室",
						url:
							"https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421e0f852882e3e6e5f301c9aa596522b2043f84ba24ebecaf8/node/279661",
					},
				]);
			case KYTZ_MAIN_PREFIX + 0:
				return Promise.resolve([
					{
						channel: "KYTZ",
						date: "2020.09.17",
						name: "转发：国家知识产权局关于评选第二十二届中国专利奖的通知",
						source: "科研院",
						url:
							"https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fbee589e2028701e7d018ae28c462a3be90b228bbda6767746aeb6/kybg/detail.jsp?boardid=34&seq=31631",
					},
					{
						channel: "KYTZ",
						date: "2020.09.11",
						name: "清华大学国际大科学项目培育计划预研课题立项公示",
						source: "科研院",
						url:
							"https://webvpn.tsinghua.edu.cn/http/77726476706e69737468656265737421fbee589e2028701e7d018ae28c462a3be90b228bbda6767746aeb6/kybg/detail.jsp?boardid=34&seq=31604",
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
			let newsUrl: string = item.children[3].attribs.href;
			if (newsUrl[0] === "/") {
				newsUrl = "https://webvpn.tsinghua.edu.cn" + newsUrl;
			}
			newsList.push(
				new newsSlice(
					getCheerioText(item, 3),
					newsUrl,
					getCheerioText(item, 7),
					item.children[4].data?.substr(3, item.children[4].data?.length - 5) ??
						"",
					channel,
				),
			);
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
		["UTF-8", ".cont_doc_box span", "div.field-item"],
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
	url: string,
): Promise<[string, string, string]> => {
	const [encoding, title, content] = getNewsDetailPolicy(url);
	const html = mocked()
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
