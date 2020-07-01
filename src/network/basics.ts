import cheerio from "cheerio";
import {retrieve, retryWrapper} from "./core";
import {GET_REPORT_URL, INFO_ROOT_URL} from "../constants/strings";
import {getCheerioText} from "../utils/cheerio";
import {ReportItem, semesterWeight} from "../models/home";

export const getReport = async (): Promise<[ReportItem]> =>
	retryWrapper(
		792,
		retrieve(GET_REPORT_URL, INFO_ROOT_URL, undefined, "GBK").then((str) =>
			(cheerio("#table1", str)
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
				.get() as [ReportItem]).sort(
				(a, b) => semesterWeight(a.semester) - semesterWeight(b.semester),
			),
		),
	);
