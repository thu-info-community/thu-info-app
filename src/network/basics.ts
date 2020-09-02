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
	GET_BKS_REPORT_URL,
	GET_YJS_REPORT_URL,
	INFO_ROOT_URL,
	JOGGING_REFERER,
	JOGGING_URL,
	LOSE_CARD_URL,
	PHYSICAL_EXAM_REFERER,
	PHYSICAL_EXAM_URL,
} from "../constants/strings";
import {getCheerioText} from "../utils/cheerio";
import {Course} from "../models/home/report";
import {Record} from "../models/home/expenditure";
import {Form, InputTag, Overall, toPersons} from "../models/home/assessment";
import "../../src/utils/extensions";
import {encodeToGb2312} from "../utils/encodeToGb2312";
import {JoggingRecord} from "../models/home/jogging";
import {currState} from "../redux/store";

const gradeToOldGPA = new Map<string, number>([
	["A-", 3.7],
	["B+", 3.3],
	["B", 3.0],
	["B-", 2.7],
	["C+", 2.3],
	["C", 2.0],
	["C-", 1.7],
	["D+", 1.3],
	["D", 1.0],
]);

export const getReport = (): Promise<Course[]> =>
	retryWrapper(
		792,
		retrieve(
			currState().config.graduate ? GET_YJS_REPORT_URL : GET_BKS_REPORT_URL,
			INFO_ROOT_URL,
			undefined,
			"GBK",
		).then((str) => {
			const newGPA = currState().config.newGPA;
			const result = cheerio("#table1", str)
				.children()
				.slice(1)
				.map((_, element) => {
					const grade = getCheerioText(element, 7);
					let point = Number(getCheerioText(element, 9));
					if (!newGPA) {
						point = gradeToOldGPA.get(grade) ?? point;
					}
					return {
						name: getCheerioText(element, 3),
						credit: Number(getCheerioText(element, 5)),
						grade,
						point,
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

export const getPhysicalExamResult = (): Promise<[string, string][]> =>
	retryWrapper(
		792,
		retrieve(PHYSICAL_EXAM_URL, PHYSICAL_EXAM_REFERER, undefined, "GBK").then(
			(s) => {
				const json = JSON.parse(s.substring(1, s.length - 1));
				if (json.success === "false") {
					throw new Error("Getting physical exam result failed.");
				} else {
					return [
						["是否免测", json.sfmc],
						["免测原因", json.mcyy],
						["总分", json.zf],
						["标准分", json.bzf],
						["附加分", json.fjf],
						["长跑附加分", json.cpfjf],
						["身高", json.sg],
						["体重", json.tz],
						["身高体重分数", json.sgtzfs],
						["肺活量", json.fhl],
						["肺活量分数", json.fhltzfs],
						["800M跑", json.bbmp],
						["800M跑分数", json.bbmpfs],
						["1000M跑", json.yqmp],
						["1000M跑分数", json.yqmpfs],
						["50M跑", json.wsmp],
						["50M跑分数", json.wsmpfs],
						["立定跳远", json.ldty],
						["立定跳远分数", json.ldtyfs],
						["坐位体前屈", json.zwtqq],
						["坐位体前屈分数", json.zwtqqfs],
						["仰卧起坐", json.ywqz],
						["仰卧起坐分数", json.ywqzfs],
						["引体向上", json.ytxs],
						["引体向上分数", json.ytxsfs],
						["体育课成绩", json.tykcj],
					];
				}
			},
		),
	);

// TODO: jogging record to be implemented
export const getJoggingRecord = (): Promise<JoggingRecord[]> =>
	retryWrapper(
		792,
		retrieve(JOGGING_URL, JOGGING_REFERER, undefined, "GBK"),
	).then((s) => {
		console.log(s);
		return [];
	});

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
