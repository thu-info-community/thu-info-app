import cheerio from "cheerio";
import {getCsrfToken, roamingWrapperWithMocks} from "./core";
import {
    ASSESSMENT_BASE_URL,
    ASSESSMENT_LIST_URL,
    ASSESSMENT_SUBMIT_URL,
    BANK_PAYMENT_SEARCH_URL,
    BKS_REPORT_BXR_URL,
    CALENDAR_URL,
    CLASSROOM_LIST_URL,
    CLASSROOM_STATE_MIDDLE,
    CLASSROOM_STATE_PREFIX,
    COUNT_DOWN_URL,
    EMAIL_BASE_URL,
    EXPENDITURE_URL,
    FOUNDATION_BANK_PAYMENT_SEARCH_URL,
    GET_BKS_REPORT_URL,
    GET_YJS_REPORT_URL,
    INVOICE_CONTENT_URL,
    INVOICE_LIST_URL,
    LOSE_CARD_URL,
    PHYSICAL_EXAM_URL,
    SWITCH_LANG_URL,
    YJS_REPORT_BXR_URL,
    CALENDAR_IMAGE_URL,
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
import {InfoHelper} from "../index";
import {arbitraryEncode, uFetch} from "../utils/network";
import {
    MOCK_ASSESSMENT_FORM,
    MOCK_ASSESSMENT_LIST,
    MOCK_BANK_PAYMENT,
    MOCK_CALENDAR_DATA,
    MOCK_CLASSROOM_LIST,
    MOCK_CLASSROOM_STATE,
    MOCK_COUNTDOWN_DATA,
    MOCK_EXPENDITURES,
    MOCK_INVOICE_DATA,
    MOCK_LOSE_CARD_CODE,
    MOCK_PHYSICAL_EXAM_RESULT,
    MOCK_REPORT,
    SAMPLE_INVOICE_BASE64,
} from "../mocks/basics";
import {
    AssessmentError,
    ClassroomStateError,
    LibError,
    LoseCardError,
    ReportError,
    UserInfoError,
} from "../utils/error";
import {BankPayment, BankPaymentByMonth} from "../models/home/bank";
import {CalendarData} from "../models/schedule/calendar";
import {Invoice} from "../models/home/invoice";
import {Classroom, ClassroomState, ClassroomStateResult, ClassroomStatus} from "../models/home/classroom";
import {imageType} from "image-size/dist/types";

type Cheerio = ReturnType<typeof cheerio>;
type Element = Cheerio[number];
type TagElement = Element & {type: "tag"};

export const webVPNTitle = "<title>清华大学WebVPN</title>";
export const systemMessage = "time out用户登陆超时或访问内容不存在。请重试";

export const getUserInfo = async (helper: InfoHelper): Promise<{
    fullName: string;
    emailName: string;
}> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "F315577F5BF20E1B1668EDD594B2C04F",
        async (param) => {
            if (param === undefined) {
                throw new LibError();
            } else {
                const $ = cheerio.load(param);
                const fullName = $(".account").text();
                const email = $(".email").text();
                const emailRes = /<(.+?)@mails.tsinghua.edu.cn>/g.exec(email);
                if (emailRes === null || emailRes[1] === undefined) {
                    throw new UserInfoError();
                }
                return {fullName, emailName: emailRes[1]};
            }
        },
        {
            fullName: "",
            emailName: "",
        },
    );

export const naiveSendMail = async (helper: InfoHelper, subject: string, content: string, recipient: string): Promise<void> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "F315577F5BF20E1B1668EDD594B2C04F",
        async (param) => {
            if (param === undefined) {
                throw new LibError();
            } else {
                const composeUrl = EMAIL_BASE_URL + cheerio.load(param)(".compose").attr().href;
                const composeHtml = await uFetch(composeUrl);
                const $ = cheerio.load(composeHtml);
                const form: {[key: string]: string} = {};
                const formInputs = $("#sendmail input");
                formInputs.each((_, e) => {
                    if (e.type === "tag" && e.attribs.name) {
                        form[e.attribs.name] = e.attribs.value ?? "";
                    }
                });
                form.subject = subject;
                form.content = content;
                form.to = `""<${recipient}>,`;
                form.chkSaveToSent = "on";
                delete form.chkUrgent;
                delete form.chkNeedRcpt;
                delete form.autoDel;
                delete form.encryptPassword;
                delete form.savePassword;
                form.btnAddAttach = "0";
                form.btnCreateImg = "0";
                form.signSet = "-1";
                const result = await uFetch(EMAIL_BASE_URL + "compose/" + $("#sendmail").attr().action + "&action=deliver&needAudit=undefined&smsAddrs=", form);
                if (!result.includes("savercpt.jsp")) {
                    throw new LibError();
                }
            }
        },
        undefined,
    );

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
    roamingWrapperWithMocks(
        helper,
        "default",
        helper.graduate() ? "E35232808C08C8C5F199F13BF6B7F5D0": "B7EF0ADF9406335AD7905B30CD7B49B1",
        () => Promise.all([
            uFetch(helper.graduate() ? GET_YJS_REPORT_URL : (`${GET_BKS_REPORT_URL}&flag=di${flag}`)),
            bx && flag === 1
                ? uFetch(helper.graduate() ? YJS_REPORT_BXR_URL : BKS_REPORT_BXR_URL)
                : undefined,
        ]).then(([str, bxStr]: [string, string | undefined]) => {
            const bxSet = new Set<string>();
            if (bxStr) {
                const childrenOriginal = cheerio(".table-striped tr", bxStr);
                const children = childrenOriginal.slice(1, childrenOriginal.length - 1);
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
            const result = cheerio("[cellspacing=1] tr", str)
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
                if (str.includes(systemMessage)) {
                    throw new ReportError(systemMessage);
                } else if (str.includes(webVPNTitle)) {
                    throw new LibError();
                } else {
                    throw new ReportError("thu-info-lib 未处理的异常");
                }
            }
            return result;
        }),
        MOCK_REPORT,
    );

export const getAssessmentList = (
    helper: InfoHelper,
): Promise<[string, boolean, string][]> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "0D8B99BA23FD2BA22428D9C8AA0AB508",
        () => uFetch(ASSESSMENT_LIST_URL).then((str) => {
            if (str.includes("对不起，现在不是填写问卷时间")) {
                throw new AssessmentError("对不起，现在不是填写问卷时间");
            }
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
                throw new AssessmentError();
            }
            return result;
        }),
        MOCK_ASSESSMENT_LIST,
    );

export const getAssessmentForm = (
    helper: InfoHelper,
    url: string,
): Promise<Form> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "0D8B99BA23FD2BA22428D9C8AA0AB508",
        () => uFetch(url).then((str) => {
            const $ = cheerio.load(str);
            const basics = $("#xswjtxFormid > input")
                .map((_, element) => new InputTag(element))
                .get();
            const overallSuggestion = new InputTag(
                "kcpgjgDtos[0].jtjy",
                $("#kcpgjgDtos\\[0\\]\\.jtjy").text(),
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
    roamingWrapperWithMocks(
        helper,
        "default",
        "0D8B99BA23FD2BA22428D9C8AA0AB508",
        () => uFetch(ASSESSMENT_SUBMIT_URL, form.serialize()).then((res) => {
            if (JSON.parse(res).result !== "success") {
                throw new AssessmentError(JSON.parse(res).msg);
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
    roamingWrapperWithMocks(
        helper,
        "default",
        "8BF4F9A706589060488B6B6179E462E5",
        () => uFetch(PHYSICAL_EXAM_URL).then((s) => {
            const json = JSON.parse(s);
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
): Promise<Record[]> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        helper.graduate() ? "048DD1B6BBBDFA7A6310D8F3CA53E290": "2B56CC9B3BFFA26932C4110E0C5FB35A",
        () => uFetch(EXPENDITURE_URL).then(
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
                return result;
            },
        ),
        MOCK_EXPENDITURES,
    );

export const getClassroomList = (
    helper: InfoHelper,
): Promise<Classroom[]> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "40470BB47E0849E9EF717983490BC964",
        async () => {
            const html = await uFetch(CLASSROOM_LIST_URL);
            if (html.includes(systemMessage)) {
                throw new LibError(systemMessage);
            }
            const $ = cheerio.load(html);
            const result: Classroom[] = [];
            $(".w30 a[href^=\"/http/\"]").each((_, e) => {
                if (e.type === "tag") {
                    const name = getCheerioText(e);
                    const href = e.attribs.href;
                    const match = /classroom=(.+?)&weeknumber=(\d+)/g.exec(href);
                    if (match !== null) {
                        const searchName = match[1];
                        const weekNumber = Number(match[2]);
                        result.push({name, weekNumber, searchName});
                    }
                }
            });
            if (result.length === 0) {
                throw new LibError();
            }
            return result;
        },
        MOCK_CLASSROOM_LIST,
    );

export const getClassroomState = (
    helper: InfoHelper,
    building: string,
    week: number,
): Promise<ClassroomStateResult> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "40470BB47E0849E9EF717983490BC964",
        () => uFetch(CLASSROOM_STATE_PREFIX + arbitraryEncode(building, "gb2312") + CLASSROOM_STATE_MIDDLE + week).then((s) => {
            const $ = cheerio.load(s);
            const validWeekNumbers = $("#weeknumber option").map((_, element) => Number((element as TagElement).attribs.value)).get();
            const datesOfCurrentWeek = $("[colspan=6]").map((i, element) => {
                if (i >= 7) return "";
                const text = cheerio(element).text();
                const r = /\((.+?)\)/g.exec(text);
                if (r === null || r[1] === undefined) {
                    throw new ClassroomStateError("r === null || r[1] === undefined");
                }
                return r[1];
            }).get() as [string, string, string, string, string, string, string];
            if (datesOfCurrentWeek.length < 7) {
                throw new ClassroomStateError("datesOfCurrentWeek.length < 7");
            }
            const classroomStates = $("#scrollContent>table>tbody")
                .map((_, element) =>
                    (element as TagElement).children
                        .filter((it) => it.type === "tag" && it.tagName === "tr")
                        .map((tr) => {
                            const name =
                                ((tr as TagElement).children[1] as TagElement).children[2].data?.trim() ??
                                "";
                            const status = (tr as TagElement).children
                                .slice(3)
                                .filter((it) => it.type === "tag" && it.tagName === "td")
                                .map((td) => {
                                    const classNames =
                                        (td as TagElement).attribs.class?.split(" ")?.filter((it) => it !== "colBound") ?? [];
                                    if (classNames.length > 1) {
                                        throw new ClassroomStateError("classNames.length > 1");
                                    } else {
                                        switch (classNames[0]) {
                                        case "onteaching":
                                            return ClassroomStatus.TEACHING;
                                        case "onexam":
                                            return ClassroomStatus.EXAM;
                                        case "onborrowed":
                                            return ClassroomStatus.BORROWED;
                                        case "ondisabled":
                                            return ClassroomStatus.DISABLED;
                                        case undefined:
                                            return ClassroomStatus.AVAILABLE;
                                        default:
                                            throw new ClassroomStateError(`classNames[0] === "${classNames[0]}"`);
                                        }
                                    }
                                });
                            return {name, status};
                        }),
                )
                .get() as ClassroomState[];
            if (classroomStates.length === 0 && s.indexOf("scrollContent") === -1) {
                if (s.includes(systemMessage)) {
                    throw new ClassroomStateError(systemMessage);
                } else if (s.includes(webVPNTitle)) {
                    throw new LibError();
                } else {
                    throw new ClassroomStateError("thu-info-lib 未处理的异常");
                }
            }
            return {
                validWeekNumbers,
                currentWeekNumber: week,
                datesOfCurrentWeek,
                classroomStates,
            };
        }),
        MOCK_CLASSROOM_STATE,
    );

export const getInvoiceList = (helper: InfoHelper, page: number): Promise<{data: Invoice[]; count: number}> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "625B81A7A9D148B01DA59185CC4074E1",
        async () => {
            return await uFetch(INVOICE_LIST_URL, {
                page,
                limit: 20,
                columnName: "inv_date",
                sort: "desc",
            }).then(JSON.parse);
        },
        MOCK_INVOICE_DATA,
    );

export const getInvoicePDF = (helper: InfoHelper, busNumber: string): Promise<string> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "625B81A7A9D148B01DA59185CC4074E1",
        () => uFetch(INVOICE_CONTENT_URL + busNumber),
        SAMPLE_INVOICE_BASE64,
    );

export const loseCard = (helper: InfoHelper): Promise<number> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "2B56CC9B3BFFA26932C4110E0C5FB35A",
        () => uFetch(LOSE_CARD_URL).then((s) => {
            const index = s.indexOf("var result");
            const left = s.indexOf("=", index) + 1;
            const right = s.indexOf("\n", left);
            const value = s.substring(left, right).trim();
            if (value === "null") {
                throw new LoseCardError();
            } else {
                const code = Number(value);
                if (isNaN(code)) {
                    throw new LoseCardError();
                }
                return code;
            }
        }),
        MOCK_LOSE_CARD_CODE,
    );

export const getBankPayment = async (
    helper: InfoHelper,
    foundation: boolean,
): Promise<BankPaymentByMonth[]> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        foundation ? "C1ADD6B60D050B64E0C7B8F195CE89EC" : "2A5182CB3F36E80395FC2091001BDEA6",
        async (s) => {
            if (s === undefined) {
                throw new LibError();
            }
            const options = cheerio("option", s).map((_, e) => (e as TagElement).attribs.value).get();
            if (options.length === 0) {
                return [];
            }
            const form = options.map((o) => `year=${encodeURIComponent(o)}`).join("&");
            const result = await uFetch(foundation ? FOUNDATION_BANK_PAYMENT_SEARCH_URL : BANK_PAYMENT_SEARCH_URL, form as never as object, 60000, "UTF-8", true);
            const $ = cheerio.load(result);
            const titles = $("div strong")
                .map((_, e) => {
                    const text = (e as TagElement).children[0].data?.trim();
                    if (text === undefined) {
                        return undefined;
                    }
                    const res = /(\d+年\d+月)银行代发结果/g.exec(text);
                    if (res === null || res[1] === undefined) {
                        return undefined;
                    }
                    return res[1];
                })
                .get()
                .filter((text) => text !== undefined) as string[];
            return $("div table tbody")
                .filter(index => index < titles.length)
                .map((index, e) => {
                    const rows = cheerio(e).children();
                    const data = rows.slice(1, rows.length - 1);
                    return {
                        month: titles[index],
                        payment: data.map((_, row) => {
                            const columns = cheerio(row).children();
                            return {
                                department: getCheerioText(columns[1], 0),
                                project: getCheerioText(columns[2], 0),
                                usage: getCheerioText(columns[3], 0),
                                description: getCheerioText(columns[4], 0),
                                bank: getCheerioText(columns[5], 0),
                                time: getCheerioText(columns[6], 0),
                                total: getCheerioText((columns[7] as TagElement).children[0], 0),
                                deduction: getCheerioText((columns[8] as TagElement).children[0], 0),
                                actual: getCheerioText((columns[9] as TagElement).children[0], 0),
                                deposit: getCheerioText((columns[10] as TagElement).children[0], 0),
                                cash: getCheerioText((columns[11] as TagElement).children[0], 0),
                            } as BankPayment;
                        }).get(),
                    };
                })
                .get() as BankPaymentByMonth[];
        },
        MOCK_BANK_PAYMENT,
    );

export const getCalendar = async (helper: InfoHelper): Promise<CalendarData> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "",
        async () => {
            const {object} = await uFetch(`${CALENDAR_URL}?_csrf=${await getCsrfToken()}`).then(JSON.parse);
            const firstDay = object.jyzdyt === "2023-06-27" ? "2023-06-26" : object.jyzdyt;  // 难得两遇的周二开学
            const semesterId = object.xnxq;
            const semesterCode = semesterId[semesterId.length - 1];
            const weekCount = semesterCode === "3" ? 12 : 18;
            return {firstDay, semesterId, weekCount};
        },
        MOCK_CALENDAR_DATA,
    );

export const getCalendarImageUrl = async (helper: InfoHelper, year: number, semester: "spring" | "autumn", lang: "zh" | "en"): Promise<string> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "",
        async () => {
            return `${CALENDAR_IMAGE_URL}${year-1}-${year}-${semester === "spring" ? 2 : 1}-${lang === "zh" ? "cn" : "en"}.jpg`;
        },
        "",
    );

export const countdown = async (helper: InfoHelper): Promise<string[]> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "",
        async () =>{
            const $ = cheerio.load(await uFetch(COUNT_DOWN_URL));
            const data = $(".countdown li");
            if (data.html() === null) {
                throw new LibError();
            }
            return data.map((_, e) => cheerio(e).text()).get();
        },
        MOCK_COUNTDOWN_DATA
    );

export const switchLang = async (helper: InfoHelper, lang: "zh" | "en"): Promise<void> => {
    if (helper.mocked()) {
        return;
    }
    await uFetch(`${SWITCH_LANG_URL}${lang === "zh" ? "awefawef" : "en_US"}&_csrf=${await getCsrfToken()}`);
};
