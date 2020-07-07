import cheerio from "cheerio";
import {retrieve, retryWrapper} from "./core";
import {
	ASSESSMENT_BASE_URL,
	ASSESSMENT_LIST_URL,
	ASSESSMENT_MAIN_URL,
	ASSESSMENT_SUBMIT_URL,
	GET_REPORT_URL,
	INFO_ROOT_URL,
} from "../constants/strings";
import {getCheerioText} from "../utils/cheerio";
import {Course} from "../models/home/report";
import {Form, InputTag, Overall, toPersons} from "../models/home/assessment";

export const getReport = (): Promise<Course[]> =>
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

export const getAssessmentList = (): Promise<[string, boolean, string][]> =>
	retryWrapper(
		2005,
		retrieve(ASSESSMENT_LIST_URL, ASSESSMENT_MAIN_URL).then((str) => {
			const result = cheerio("tbody", str)
				.children()
				.map((index, element) => {
					const onclick = element.children[11].firstChild.attribs.onclick;
					const href =
						ASSESSMENT_BASE_URL +
						onclick.substring(
							onclick.indexOf("Body('") + 6,
							onclick.indexOf("') })"),
						);
					return [
						[
							getCheerioText(element, 5),
							getCheerioText(element, 9) === "是",
							href,
						],
					];
				})
				.get();
			if (result.length === 0) {
				throw 0;
			}
			return result;
		}),
	);

export const getAssessmentForm = (url: string): Promise<Form> =>
	retryWrapper(
		2005,
		retrieve(url, ASSESSMENT_MAIN_URL).then((str) => {
			const $ = cheerio.load(str);
			const basics = $("#xswjtxFormid > input")
				.map((_, element) => new InputTag(element))
				.get();
			const overallSuggestion = new InputTag(
				"kcpgjgDtos[0].jtjy",
				getCheerioText($("textarea")[1]),
			);
			const overallScore = new InputTag($("#kcpjfs")[0]);
			const overall = new Overall(overallSuggestion, overallScore);
			const tabPanes = $(".tab-pane");

			const teachers = toPersons(tabPanes.first());
			const assistants = toPersons(tabPanes.first().next().next());

			return new Form(basics, overall, teachers, assistants);
		}),
	);

export const postAssessmentForm = (form: object): Promise<void> =>
	retryWrapper(
		2005,
		retrieve(ASSESSMENT_SUBMIT_URL, ASSESSMENT_MAIN_URL, form).then((res) => {
			if (JSON.parse(res).result !== "success") {
				throw 0;
			}
		}),
	);
