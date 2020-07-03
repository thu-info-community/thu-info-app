import cheerio from "cheerio";
import {retrieve, retryWrapper} from "./core";
import {GET_REPORT_URL, INFO_ROOT_URL} from "../constants/strings";
import {getCheerioText} from "../utils/cheerio";
import {Course} from "../models/home";

export const getReport = async (): Promise<Course[]> =>
	retryWrapper(
		792,
		retrieve(GET_REPORT_URL, INFO_ROOT_URL, undefined, "GBK").then((str) => {
			const result = cheerio("#table1", str)
				.children()
				.slice(1)
				.map((_, element) => {
					return {
						name: getCheerioText(element, 3),
						credit: Number(getCheerioText(element, 5)),
						grade: getCheerioText(element, 7),
						point: Number(getCheerioText(element, 9)),
						semester: getCheerioText(element, 11),
					};
				})
				.get();
			if (result.length === 0) {
				throw 0;
			}
			return result;
		}),
	);
