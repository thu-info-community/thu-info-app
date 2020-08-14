import cheerio from "cheerio";
import {retrieve, retryWrapper} from "./core";
import {
	ASSESSMENT_BASE_URL,
	ASSESSMENT_LIST_URL,
	ASSESSMENT_MAIN_URL,
	ASSESSMENT_SUBMIT_URL,
	CLASSROOM_STATE_MIDDLE,
	CLASSROOM_STATE_PREFIX,
	EXPENDITURE_URL,
	GET_REPORT_URL,
	INFO_ROOT_URL,
	LOSE_CARD_URL,
} from "../constants/strings";
import {getCheerioText} from "../utils/cheerio";
import {Course} from "../models/home/report";
import {Record} from "../models/home/expenditure";
import {Form, InputTag, Overall, toPersons} from "../models/home/assessment";
import "../../src/utils/extensions";
import {encodeToGb2312} from "../utils/encodeToGb2312";

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

export const postAssessmentForm = (form: Form): Promise<void> =>
	retryWrapper(
		2005,
		retrieve(ASSESSMENT_SUBMIT_URL, ASSESSMENT_MAIN_URL, form.serialize()).then(
			(res) => {
				if (JSON.parse(res).result !== "success") {
					throw 0;
				}
			},
		),
	);

export const getExpenditures = (beg: Date, end: Date): Promise<Record[]> =>
	retryWrapper(
		824,
		retrieve(EXPENDITURE_URL, EXPENDITURE_URL, {
			begindate: beg.format(),
			enddate: end.format(),
			transtype: "",
		}).then(async (str) => {
			const result: Record[] = [];
			let $ = cheerio.load(str);
			const page_text = $("table>tr>td>div>span").first().text().split(" ")[0];
			// @ts-ignore
			const page_cnt = Number(/共(\d+)页/.exec(page_text)[1]);
			for (let i = 0; i < page_cnt; i++) {
				if (i > 0) {
					$ = cheerio.load(
						await retrieve(
							`${EXPENDITURE_URL}?dir=next&currentPage=${i}`,
							EXPENDITURE_URL,
							{
								begindate: beg.format(),
								enddate: end.format(),
								transtype: "",
							},
						),
					);
				}
				$("table.table1>tr:not(.font10-blackB)").each((index, element) => {
					const record = {
						locale: getCheerioText(element.children[3], 1),
						category: getCheerioText(element.children[5], 1),
						date: getCheerioText(element.children[9], 0),
						value: Number(getCheerioText(element.children[11], 0).substring(1)),
					};
					if (record.category.match(/^(消费|自助缴费.*|取消充值)$/)) {
						record.value *= -1;
					}
					result.push(record);
				});
			}
			return result.reverse();
		}),
	);

export const getClassroomState = (
	name: string,
	week: number,
): Promise<[string, number[]][]> =>
	retryWrapper(
		792,
		retrieve(
			CLASSROOM_STATE_PREFIX +
				encodeToGb2312(name) +
				CLASSROOM_STATE_MIDDLE +
				week,
			undefined,
			undefined,
			"GBK",
		).then((s) => {
			const result = cheerio("#scrollContent>table>tbody", s)
				.map((_, element) =>
					element.children
						.filter((it) => it.tagName === "tr")
						.map((tr) => {
							const id = tr.children[1].children[2].data?.trim() ?? "";
							const status = tr.children
								.slice(3)
								.filter((it) => it.tagName === "td")
								.map((td) => {
									const classNames =
										td.attribs.class
											?.split(" ")
											?.filter((it) => it !== "colBound") ?? [];
									if (classNames.length > 1) {
										return 0;
									} else {
										switch (classNames[0]) {
											case "onteaching":
												return 0;
											case "onexam":
												return 1;
											case "onborrowed":
												return 2;
											case "ondisabled":
												return 3;
											case undefined:
												return 5;
											default:
												return 4;
										}
									}
								});
							return [id, status];
						}),
				)
				.get();
			if (result.length === 0 && s.indexOf("scrollContent") === -1) {
				throw "Network exception when getting classroom state.";
			}
			return result;
		}),
	);

export const loseCard = (): Promise<number> =>
	retryWrapper(
		824,
		retrieve(LOSE_CARD_URL).then((s) => {
			const index = s.indexOf("var result");
			const left = s.indexOf("=", index) + 1;
			const right = s.indexOf("\n", left);
			const value = s.substring(left, right).trim();
			if (value === "null") {
				throw "null error";
			} else {
				return Number(value);
			}
		}),
	);
