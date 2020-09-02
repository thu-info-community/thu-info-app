import {retrieve} from "./core";
import cheerio from "cheerio";
import {getCheerioText} from "src/utils/cheerio";

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
	const html = await retrieve(url, undefined, undefined, encoding);
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
