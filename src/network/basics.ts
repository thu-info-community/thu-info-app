import cheerio from "cheerio";
import {retrieve, retryWrapper} from "./core";
import {
	ASSESSMENT_BASE_URL,
	ASSESSMENT_LIST_URL,
	ASSESSMENT_MAIN_URL,
	ASSESSMENT_SUBMIT_URL,
	BKS_REPORT_BXR_URL,
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
	YJS_REPORT_BXR_URL,
} from "../constants/strings";
import {getCheerioText} from "../utils/cheerio";
import {Course} from "../models/home/report";
import {Record} from "../models/home/expenditure";
import {Form, InputTag, Overall, toPersons} from "../models/home/assessment";
import "../../src/utils/extensions";
import {encodeToGb2312} from "../utils/encodeToGb2312";
import {JoggingRecord} from "../models/home/jogging";
import {currState, mocked} from "../redux/store";
import {Buffer} from "buffer";
import excelToJson from "convert-excel-to-json";
import dayjs from "dayjs";

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
	mocked()
		? Promise.resolve([
				{
					credit: 2,
					grade: "A+",
					name: "军事理论",
					point: 4,
					semester: "2019-夏",
				},
				{
					credit: 2,
					grade: "A+",
					name: "军事技能",
					point: 4,
					semester: "2019-夏",
				},
				{
					credit: 5,
					grade: "A+",
					name: "微积分A(1)",
					point: 4,
					semester: "2019-秋",
				},
				{
					credit: 4,
					grade: "A+",
					name: "线性代数",
					point: 4,
					semester: "2019-秋",
				},
				{
					credit: 3,
					grade: "A+",
					name: "思想道德修养与法律基础",
					point: 4.0,
					semester: "2019-秋",
				},
				{
					credit: 1,
					grade: "A+",
					name: "体育(1)",
					point: 4,
					semester: "2019-秋",
				},
				{
					credit: 5,
					grade: "A+",
					name: "微积分A(2)",
					point: 4,
					semester: "2020-春",
				},
				{
					credit: 4,
					grade: "A+",
					name: "大学物理B(1)",
					point: 4,
					semester: "2020-春",
				},
				{
					credit: 3,
					grade: "A+",
					name: "中国近现代史纲要",
					point: 4,
					semester: "2020-春",
				},
				{
					credit: 1,
					grade: "A+",
					name: "形势与政策",
					point: 4,
					semester: "2020-春",
				},
				{
					credit: 1,
					grade: "A+",
					name: "体育(2)",
					point: 4,
					semester: "2020-春",
				},
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  ])
		: retryWrapper(
				792,
				Promise.all([
					retrieve(
						currState().config.graduate
							? GET_YJS_REPORT_URL
							: GET_BKS_REPORT_URL,
						INFO_ROOT_URL,
						undefined,
						"GBK",
					),
					currState().config.bx
						? retrieve(
								currState().config.graduate
									? YJS_REPORT_BXR_URL
									: BKS_REPORT_BXR_URL,
								INFO_ROOT_URL,
								undefined,
								"GBK",
								// eslint-disable-next-line no-mixed-spaces-and-tabs
						  )
						: undefined,
				]).then(([str, bxStr]: [string, string | undefined]) => {
					const bxSet = new Set<string>();
					if (bxStr) {
						const childrenOriginal = cheerio(
							".table-striped",
							bxStr,
						).children();
						const children = childrenOriginal.slice(
							1,
							childrenOriginal.length - 1,
						);
						children.each((index, element) => {
							if (element.children.length === 25) {
								// I don't know why this is needed... Weird...
								const transformedElement = cheerio(element);
								const type = getCheerioText(
									transformedElement.children()[8],
									0,
								);
								if (type === "必修" || type === "限选") {
									bxSet.add(
										getCheerioText(transformedElement.children()[0], 0),
									);
								}
							}
						});
					}
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
							return bxStr === undefined ||
								bxSet.has(getCheerioText(element, 1))
								? {
										name: getCheerioText(element, 3),
										credit: Number(getCheerioText(element, 5)),
										grade,
										point,
										semester: getCheerioText(element, 11),
										// eslint-disable-next-line no-mixed-spaces-and-tabs
								  }
								: undefined;
						})
						.get();
					if (result.length === 0 && str.indexOf("table1") === -1) {
						throw new Error("Getting report failure.");
					}
					return result;
				}),
				// eslint-disable-next-line no-mixed-spaces-and-tabs
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
	mocked()
		? Promise.resolve([
				["是否免测", "否"],
				["免测原因", ""],
				["总分", "300"],
				["标准分", "300"],
				["附加分", "0"],
				["长跑附加分", "0"],
				["身高", "175"],
				["体重", "66"],
				["身高体重分数", "40"],
				["肺活量", "2000"],
				["肺活量分数", "20"],
				["800M跑", "3'40"],
				["800M跑分数", "50"],
				["1000M跑", ""],
				["1000M跑分数", ""],
				["50M跑", "8.7"],
				["50M跑分数", "40"],
				["立定跳远", "1.9"],
				["立定跳远分数", "20"],
				["坐位体前屈", "10"],
				["坐位体前屈分数", "30"],
				["仰卧起坐", ""],
				["仰卧起坐分数", ""],
				["引体向上", "10"],
				["引体向上分数", "20"],
				["体育课成绩", ""],
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  ])
		: retryWrapper(
				792,
				retrieve(
					PHYSICAL_EXAM_URL,
					PHYSICAL_EXAM_REFERER,
					undefined,
					"GBK",
				).then((s) => {
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
				}),
				// eslint-disable-next-line no-mixed-spaces-and-tabs
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

export const getExpenditures = (
	beg: Date,
	end: Date,
): Promise<[Record[], number, number, number]> =>
	retryWrapper(
		824,
		retrieve(EXPENDITURE_URL, EXPENDITURE_URL, undefined, "base64").then(
			(data) => {
				const sheet = excelToJson({
					source: Buffer.from(data).toString(),
					header: {rows: 1},
					columnToKey: {
						A: "value",
						B: "locale",
						C: "category",
						D: "value",
						E: "date",
						F: "value",
					},
				}).Sheet1;
				const result = sheet.slice(0, sheet.length - 1);
				result.forEach((record: {value: string | number; category: string}) => {
					record.value = Number(record.value);
					if (record.category.match(/^(消费|自助缴费.*|取消充值)$/)) {
						record.value *= -1;
					}
				});
				const remainder = result.reduce(
					(prev: number, curr: Record) => prev + curr.value,
					0,
				);
				let income = 0;
				let outgo = 0;
				const filtered = result
					.filter((it: Record) => {
						const d = dayjs(it.date.split(" ")[0], "YYYY-MM-DD")
							.toDate()
							.valueOf();
						const valid = d >= beg.valueOf() - 86400000 && d <= end.valueOf(); // Locales are nasty.
						if (valid) {
							if (it.value > 0) {
								income += it.value;
							} else {
								outgo -= it.value;
							}
						}
						return valid;
					})
					.reverse();
				return [filtered, income, outgo, remainder];
			},
		),
	);

const basePatterns = [
	[5, 0, 0, 0, 2, 5],
	[0, 0, 0, 5, 0, 5],
	[0, 0, 0, 2, 2, 5],
	[5, 0, 0, 0, 0, 2],
	[5, 0, 0, 2, 2, 0],
	[0, 0, 0, 0, 5, 0],
	[5, 0, 0, 5, 5, 2],
];

const rand = () => Math.floor(Math.random() * basePatterns.length);

const generateWeek = () =>
	basePatterns[rand()]
		.concat(basePatterns[rand()])
		.concat(basePatterns[rand()])
		.concat(basePatterns[rand()])
		.concat(basePatterns[rand()])
		.concat(basePatterns[rand()])
		.concat(basePatterns[rand()]);

const generatedPattern = [
	["101:240", generateWeek()],
	["102:40", generateWeek()],
	["103:40", generateWeek()],
	["104:240", generateWeek()],
	["201:150", generateWeek()],
	["202:40", generateWeek()],
	["203:40", generateWeek()],
	["204:40", generateWeek()],
	["205:150", generateWeek()],
];

export const getClassroomState = (
	name: string,
	week: number,
): Promise<[string, number[]][]> =>
	mocked()
		? Promise.resolve(generatedPattern)
		: retryWrapper(
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
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  );

export const loseCard = (): Promise<number> =>
	mocked()
		? Promise.resolve(2)
		: retryWrapper(
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
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  );
