import {JWGG_MAIN_URL} from "src/constants/strings";
import {retrieve} from "./core";
import cheerio from "cheerio";
import {getCheerioText} from "src/utils/cheerio";

export class newsSlice {
	constructor(
		readonly name: string,
		readonly url: string,
		readonly date: string,
		readonly source: string,
	) {}
}

export const getNewsList = (): Promise<newsSlice[]> => {
	return retrieve(JWGG_MAIN_URL).then((str) => {
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
				),
			);
		});
		return newsList;
	});
};

export const getNewsDetail = (url: string): Promise<string> => {
	return retrieve(url).then((str) => {
		const $ = cheerio.load(str);
		return $("html").html() ?? "<html></html>";
	});
};
