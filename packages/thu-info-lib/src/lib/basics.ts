import cheerio from "cheerio";
import {retryWrapperWithMocks} from "./core";
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
    toPersons,
} from "../models/home/assessment";
import XLSX from "xlsx";
import dayjs from "dayjs";
import {InfoHelper} from "../index";
import {arbitraryEncode, uFetch} from "../utils/network";
import {
    MOCK_ASSESSMENT_FORM,
    MOCK_ASSESSMENT_LIST,
    MOCK_CLASSROOM_STATE,
    MOCK_EXPENDITURES,
    MOCK_LOSE_CARD_CODE,
    MOCK_PHYSICAL_EXAM_RESULT,
    MOCK_REPORT,
} from "../mocks/basics";
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
    bx: boolean,
    newGPA: boolean,
    flag = 1,
): Promise<Course[]> =>
    retryWrapperWithMocks(
        helper,
        792,
        () => Promise.all([
            uFetch(helper.graduate() ? GET_YJS_REPORT_URL : (`${GET_BKS_REPORT_URL}&flag=di${flag}`), INFO_ROOT_URL),
            bx
                ? uFetch(helper.graduate() ? YJS_REPORT_BXR_URL : BKS_REPORT_BXR_URL, INFO_ROOT_URL)
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
            const graduate = helper.graduate();
            const result = cheerio("[cellspacing=1]", str)
                .children()
                .slice(1)
                .map((_, element) => {
                    const grade = getCheerioText(element, graduate ? 9 : 7);
                    let point = Number(getCheerioText(element, graduate ? 11 : 9));
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
                            semester: getCheerioText(element, graduate ? 13 : 11),
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
        MOCK_REPORT,
    );

export const getAssessmentList = (
    helper: InfoHelper,
): Promise<[string, boolean, string][]> =>
    retryWrapperWithMocks(
        helper,
        2005,
        () => uFetch(ASSESSMENT_LIST_URL, ASSESSMENT_MAIN_URL).then((str) => {
            const result = cheerio("tbody", str)
                .children()
                .map((index, element) => {
                    const onclick = (((element as TagElement)
                        .children[11] as TagElement).firstChild as TagElement).attribs
                        .onclick;
                    const href =
                        ASSESSMENT_BASE_URL +
                        onclick.substring(onclick.indexOf("Body('") + 6, onclick.indexOf("') })"));
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
        MOCK_ASSESSMENT_LIST,
    );

export const getAssessmentForm = (
    helper: InfoHelper,
    url: string,
): Promise<Form> =>
    retryWrapperWithMocks(
        helper,
        2005,
        () => uFetch(url, ASSESSMENT_MAIN_URL).then((str) => {
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
        MOCK_ASSESSMENT_FORM(url),
    );

export const postAssessmentForm = (
    helper: InfoHelper,
    form: Form,
): Promise<void> =>
    retryWrapperWithMocks(
        helper,
        2005,
        () => uFetch(
            ASSESSMENT_SUBMIT_URL,
            ASSESSMENT_MAIN_URL,
            form.serialize(),
        ).then((res) => {
            if (JSON.parse(res).result !== "success") {
                throw 0;
            }
        }),
        undefined,
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
    retryWrapperWithMocks(
        helper,
        792,
        () => uFetch(PHYSICAL_EXAM_URL, PHYSICAL_EXAM_REFERER).then((s) => {
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
        MOCK_PHYSICAL_EXAM_RESULT,
    );

export const getExpenditures = (
    helper: InfoHelper,
    beg: Date,
    end: Date,
): Promise<[Record[], number, number, number]> =>
    retryWrapperWithMocks(
        helper,
        824,
        () => uFetch(EXPENDITURE_URL, EXPENDITURE_URL).then(
            (data) => {
                const workbook = XLSX.read(data, {sheetStubs: true, cellDates: true});
                const sheet = XLSX.utils.sheet_to_json(
                    workbook.Sheets.Sheet1, {header: ["index", "locale", "category", "terminal", "date", "value"]}
                ) as any[];
                const result = sheet.slice(1, sheet.length - 1);
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
                    (prev: number, curr: Record) =>
                        prev + (curr.category === "领取旧卡余额" ? 0 : curr.value),
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
                        if (valid && it.category !== "领取旧卡余额") {
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
        MOCK_EXPENDITURES,
    );

export const getClassroomState = (
    helper: InfoHelper,
    name: string,
    week: number,
): Promise<[string, number[]][]> =>
    retryWrapperWithMocks(
        helper,
        792,
        () => uFetch(CLASSROOM_STATE_PREFIX + arbitraryEncode(name, "gb2312") + CLASSROOM_STATE_MIDDLE + week).then((s) => {
            const result = cheerio("#scrollContent>table>tbody", s)
                .map((_, element) =>
                    (element as TagElement).children
                        .filter((it) => it.type === "tag" && it.tagName === "tr")
                        .map((tr) => {
                            const id =
                                ((tr as TagElement).children[1] as TagElement).children[2].data?.trim() ??
                                "";
                            const status = (tr as TagElement).children
                                .slice(3)
                                .filter((it) => it.type === "tag" && it.tagName === "td")
                                .map((td) => {
                                    const classNames =
                                        (td as TagElement).attribs.class?.split(" ")?.filter((it) => it !== "colBound") ?? [];
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
        MOCK_CLASSROOM_STATE,
    );

export const loseCard = (helper: InfoHelper): Promise<number> =>
    retryWrapperWithMocks(
        helper,
        824,
        () => uFetch(LOSE_CARD_URL).then((s) => {
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
        MOCK_LOSE_CARD_CODE,
    );
