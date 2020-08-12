import {retrieve} from "./core";
import cheerio from "cheerio";
import {getCheerioText} from "src/utils/cheerio";

export class newsSlice {
	constructor(
		readonly name: string,
		readonly url: string,
		readonly date: string,
		readonly source: string,
		readonly channel: string,
	) {}
}

export const getNewsList = (
	url: string,
	channel: string,
): Promise<newsSlice[]> => {
	return retrieve(url).then((str) => {
		const $ = cheerio.load(str);
		let newsList: newsSlice[] = [];
		$("ul.cont_list > li", str).each((_, item) => {
			newsList.push(
				new newsSlice(
					getCheerioText(item, 3),
					item.children[3].attribs.href,
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
	return retrieve(url, undefined, undefined, "GBK").then((str) => {
		const $ = cheerio.load(str);
		return $("html").html() ?? "<html></html>";
	});
};
