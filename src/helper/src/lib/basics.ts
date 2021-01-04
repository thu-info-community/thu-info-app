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
import {
	Form,
	InputTag,
	Overall,
	Person,
	toPersons,
} from "../models/home/assessment";
import "../utils/extensions";
import {encodeToGb2312} from "../utils/encodeToGb2312";
import {JoggingRecord} from "../models/home/jogging";
import {Buffer} from "buffer";
import excelToJson from "convert-excel-to-json";
import dayjs from "dayjs";
import {InfoHelper} from "../index";
type Cheerio = ReturnType<typeof cheerio>;
type Element = Cheerio[number];
type TagElement = Element & {type: "tag"};

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

export const getReport = (
	helper: InfoHelper,
	graduate: boolean,
	bx: boolean,
	newGPA: boolean,
): Promise<Course[]> =>
	helper.mocked()
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
					point: 4,
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
				helper,
				792,
				Promise.all([
					retrieve(
						graduate ? GET_YJS_REPORT_URL : GET_BKS_REPORT_URL,
						INFO_ROOT_URL,
						undefined,
						"GBK",
					),
					bx
						? retrieve(
								graduate ? YJS_REPORT_BXR_URL : BKS_REPORT_BXR_URL,
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
							if (element.type === "tag" && element.children.length === 25) {
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

export const getAssessmentList = (
	helper: InfoHelper,
): Promise<[string, boolean, string][]> =>
	helper.mocked()
		? Promise.resolve([
				["微积分A(2)", true, "Mr. Z"],
				["高等线性代数选讲", true, "Mr. L"],
				["大学物理B(1)", true, "Mr. L"],
				["中国近代史纲要", true, "Ms. S"],
				["形势与政策", true, "Mr. L"],
				["一年级男生体育(2)", true, "Mr. Y"],
				["离散数学(2)", true, "Mr. Z"],
				["面向对象的程序设计基础", true, "Mr. H"],
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  ])
		: retryWrapper(
				helper,
				2005,
				retrieve(ASSESSMENT_LIST_URL, ASSESSMENT_MAIN_URL).then((str) => {
					const result = cheerio("tbody", str)
						.children()
						.map((index, element) => {
							const onclick = (((element as TagElement)
								.children[11] as TagElement).firstChild as TagElement).attribs
								.onclick;
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
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  );

const makeMockQuestion = (question: string) => ({
	question,
	suggestion: new InputTag("", ""),
	score: new InputTag("", "7"),
	others: [],
});

export const getAssessmentForm = (
	helper: InfoHelper,
	url: string,
): Promise<Form> =>
	helper.mocked()
		? Promise.resolve(
				new Form(
					[],
					new Overall(new InputTag("", ""), new InputTag("", "7")),
					[
						new Person(url, [
							makeMockQuestion("老师教学态度认真负责"),
							makeMockQuestion("老师讲解清楚，深入浅出"),
							makeMockQuestion("老师关注我们和我们的学习"),
							makeMockQuestion("老师严格要求，促使我认真学习"),
							makeMockQuestion("老师教学注重师生互动"),
							makeMockQuestion("老师教学能让我体会学科特点和思维方式"),
							makeMockQuestion("课程教学符合教学大纲"),
							makeMockQuestion("老师的教学有效激发我的学习志趣"),
						]),
					],
					[],
				),
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  )
		: retryWrapper(
				helper,
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
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  );

export const postAssessmentForm = (
	helper: InfoHelper,
	form: Form,
): Promise<void> =>
	helper.mocked()
		? Promise.resolve()
		: retryWrapper(
				helper,
				2005,
				retrieve(
					ASSESSMENT_SUBMIT_URL,
					ASSESSMENT_MAIN_URL,
					form.serialize(),
				).then((res) => {
					if (JSON.parse(res).result !== "success") {
						throw 0;
					}
				}),
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  );

const physicalExamResultTotal = (json: any) =>
	Number(json.fhltzfs) * 0.15 +
	Number(json.wsmpfs) * 0.2 +
	Number(json.zwtqqfs) * 0.1 +
	Number(json.ldtyfs) * 0.1 +
	Number(json.ytxsfs) * 0.1 +
	Number(json.yqmpfs) * 0.2 +
	Number(json.ywqzfs) * 0.1 +
	Number(json.bbmpfs) * 0.2 +
	Number(json.sgtzfs) * 0.15;

export const getPhysicalExamResult = (
	helper: InfoHelper,
): Promise<[string, string][]> =>
	helper.mocked()
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
				helper,
				792,
				retrieve(
					PHYSICAL_EXAM_URL,
					PHYSICAL_EXAM_REFERER,
					undefined,
					"GBK",
				).then((s) => {
					const json = JSON.parse(
						// eslint-disable-next-line quotes
						s.replace(/'/g, '"'),
					);
					if (json.success === "false") {
						return [["状态", "暂无可查成绩"]];
					} else {
						return [
							["是否免测", json.sfmc],
							["免测原因", json.mcyy],
							["总分", json.zf],
							["标准分", json.bzf],
							["附加分", json.fjf],
							["长跑附加分", json.cpfjf],
							[
								"参考成绩（APP自动结算，仅供参考）",
								physicalExamResultTotal(json),
							],
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
export const getJoggingRecord = (
	helper: InfoHelper,
): Promise<JoggingRecord[]> =>
	retryWrapper(
		helper,
		792,
		retrieve(JOGGING_URL, JOGGING_REFERER, undefined, "GBK"),
	).then((s) => {
		console.log(s);
		return [];
	});

export const getExpenditures = (
	helper: InfoHelper,
	beg: Date,
	end: Date,
): Promise<[Record[], number, number, number]> =>
	helper.mocked()
		? Promise.resolve([
				[
					{
						category: "消费",
						date: "2020-09-19 11:38",
						locale: "饮食中心",
						value: -6.45,
					},
					{
						category: "消费",
						date: "2020-09-19 07:12",
						locale: "饮食中心",
						value: -3.2,
					},
					{
						category: "消费",
						date: "2020-09-18 18:02",
						locale: "饮食中心",
						value: -8,
					},
					{
						category: "消费",
						date: "2020-09-18 07:30",
						locale: "饮食中心",
						value: -4.5,
					},
					{
						category: "消费",
						date: "2020-09-17 17:52",
						locale: "饮食中心",
						value: -8.8,
					},
					{
						category: "消费",
						date: "2020-09-17 11:46",
						locale: "饮食中心",
						value: -6.5,
					},
					{
						category: "消费",
						date: "2020-09-17 08:33",
						locale: "饮食中心",
						value: -4,
					},
					{
						category: "消费",
						date: "2020-09-16 18:01",
						locale: "饮食中心",
						value: -6.45,
					},
					{
						category: "消费",
						date: "2020-09-16 11:45",
						locale: "饮食中心",
						value: -8,
					},
					{
						category: "消费",
						date: "2020-09-16 07:25",
						locale: "饮食中心",
						value: -4.7,
					},
					{
						category: "消费",
						date: "2020-09-15 11:55",
						locale: "饮食中心",
						value: -5.7,
					},
					{
						category: "消费",
						date: "2020-09-15 07:08",
						locale: "饮食中心",
						value: -2.5,
					},
					{
						category: "自助缴费(学生公寓水费)",
						date: "2020-09-14 18:37",
						locale: "桃李园西门厅左",
						value: -20,
					},
					{
						category: "领取圈存",
						date: "2020-09-14 18:37",
						locale: "桃李园西门厅左",
						value: 300,
					},
					{
						category: "消费",
						date: "2020-09-14 18:00",
						locale: "饮食中心",
						value: -12,
					},
					{
						category: "消费",
						date: "2020-09-14 12:01",
						locale: "饮食中心",
						value: -9,
					},
					{
						category: "消费",
						date: "2020-09-14 07:22",
						locale: "饮食中心",
						value: -4.2,
					},
					{
						category: "消费",
						date: "2020-09-13 18:34",
						locale: "饮食中心",
						value: -15,
					},
					{
						category: "消费",
						date: "2020-09-13 12:19",
						locale: "饮食中心",
						value: -4.5,
					},
					{
						category: "消费",
						date: "2020-09-13 07:22",
						locale: "饮食中心",
						value: -3.1,
					},
					{
						category: "消费",
						date: "2020-09-12 18:03",
						locale: "饮食中心",
						value: -6.8,
					},
					{
						category: "消费",
						date: "2020-09-12 12:17",
						locale: "饮食中心",
						value: -15,
					},
					{
						category: "消费",
						date: "2020-09-12 07:56",
						locale: "饮食中心",
						value: -4,
					},
					{
						category: "消费",
						date: "2020-09-11 18:23",
						locale: "饮食中心",
						value: -6,
					},
					{
						category: "消费",
						date: "2020-09-11 12:04",
						locale: "饮食中心",
						value: -6.7,
					},
					{
						category: "消费",
						date: "2020-09-11 07:56",
						locale: "饮食中心",
						value: -5.2,
					},
					{
						category: "消费",
						date: "2020-09-10 17:21",
						locale: "饮食中心",
						value: -8.4,
					},
					{
						category: "消费",
						date: "2020-09-10 11:37",
						locale: "饮食中心",
						value: -6.5,
					},
					{
						category: "消费",
						date: "2020-09-10 08:36",
						locale: "饮食中心",
						value: -4.5,
					},
					{
						category: "消费",
						date: "2020-09-09 17:54",
						locale: "饮食中心",
						value: -8.8,
					},
					{
						category: "消费",
						date: "2020-09-09 11:27",
						locale: "饮食中心",
						value: -5,
					},
					{
						category: "消费",
						date: "2020-09-08 18:26",
						locale: "饮食中心",
						value: -8.5,
					},
					{
						category: "消费",
						date: "2020-09-08 12:14",
						locale: "饮食中心",
						value: -10,
					},
					{
						category: "消费",
						date: "2020-09-08 08:23",
						locale: "饮食中心",
						value: -3.1,
					},
					{
						category: "消费",
						date: "2020-09-07 17:47",
						locale: "饮食中心",
						value: -8,
					},
					{
						category: "消费",
						date: "2020-09-07 12:04",
						locale: "饮食中心",
						value: -11.61,
					},
					{
						category: "消费",
						date: "2020-09-07 08:02",
						locale: "饮食中心",
						value: -2.3,
					},
					{
						category: "消费",
						date: "2020-09-06 18:28",
						locale: "饮食中心",
						value: -4,
					},
					{
						category: "消费",
						date: "2020-09-06 12:03",
						locale: "饮食中心",
						value: -5.2,
					},
					{
						category: "消费",
						date: "2020-09-06 08:02",
						locale: "饮食中心",
						value: -5.9,
					},
				],
				300,
				272.11,
				27.89,
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  ])
		: retryWrapper(
				helper,
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
						result.forEach(
							(record: {value: string | number; category: string}) => {
								record.value = Number(record.value);
								if (
									record.category.match(
										/^(消费|自助缴费.*|取消充值|领取旧卡余额)$/,
									)
								) {
									record.value *= -1;
								}
							},
						);
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
								const valid =
									d >= beg.valueOf() - 86400000 && d <= end.valueOf(); // Locales are nasty.
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
				// eslint-disable-next-line no-mixed-spaces-and-tabs
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
	helper: InfoHelper,
	name: string,
	week: number,
): Promise<[string, number[]][]> =>
	helper.mocked()
		? Promise.resolve(generatedPattern)
		: retryWrapper(
				helper,
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
							(element as TagElement).children
								.filter((it) => it.type === "tag" && it.tagName === "tr")
								.map((tr) => {
									const id =
										((tr as TagElement)
											.children[1] as TagElement).children[2].data?.trim() ??
										"";
									const status = (tr as TagElement).children
										.slice(3)
										.filter((it) => it.type === "tag" && it.tagName === "td")
										.map((td) => {
											const classNames =
												(td as TagElement).attribs.class
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

export const loseCard = (helper: InfoHelper): Promise<number> =>
	helper.mocked()
		? Promise.resolve(2)
		: retryWrapper(
				helper,
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
