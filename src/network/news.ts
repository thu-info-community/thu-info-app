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

export const getNewsDetail = (url: string): Promise<string> => {
	return retrieve(url, undefined, undefined, "UTF-8").then((str) => {
		const $ = cheerio.load(str);
		let htmlString: string = "";
		$(
			"html > body > div.wrapper > div.content > section.cont_box > div.cont_doc_box > div > div.field > div.field-items > div.field-item",
		).each((_, item) => {
			htmlString += $(item).html();
		});
		return htmlString;
	});
};
