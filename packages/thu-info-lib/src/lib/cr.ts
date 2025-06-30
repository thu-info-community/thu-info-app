import {InfoHelper} from "../index";
import {
    COURSE_PLAN_URL_PREFIX,
    COURSE_PLAN_YJS_URL,
    CR_CAPTCHA_URL,
    CR_LOGIN_HOME_URL,
    CR_MAIN_URL,
    CR_MAIN_YJS_URL,
    CR_SEARCH_URL,
    CR_SEARCH_YJS_URL,
    CR_SELECT_URL,
    CR_SELECT_YJS_URL,
    CR_TREE_URL,
    CR_TREE_YJS_URL,
    CR_ZYTJB_URL,
    CR_ZYTJB_YJS_URL,
    DEADLINE_URL,
} from "../constants/strings";
import {uFetch} from "../utils/network";
import * as cheerio from "cheerio";
import type {ElementType} from "domelementtype";
import type {DataNode, Element} from "domhandler";
import {
    CoursePlan,
    CrPrimaryOpenInfo,
    CrPrimaryOpenSearchResult,
    CrRemainingInfo,
    CrRemainingSearchResult,
    CrSearchResult,
    CrSemester,
    CrTimetable,
    CrTimetableEvent,
    QueueInfo,
    SearchCoursePriorityQuery,
    SearchCoursePriorityResult,
    SearchParams,
    SelectedCourse,
} from "../models/cr/cr";
import {getCheerioText} from "../utils/cheerio";
import {getCsrfToken, roamingWrapperWithMocks} from "./core";
import {CrError, CrTimeoutError, LibError} from "../utils/error";
import {
    MOCK_AVAILABLE_SEMESTERS,
    MOCK_COURSE_PLAN,
    MOCK_CR_CURRENT_STAGE,
    MOCK_CR_PRIMARY_OPEN_SEARCH_RESULT,
    MOCK_CR_REMAINING_SEARCH_RESULT,
    MOCK_CR_SEARCH_RESULT,
    MOCK_CR_TIMETABLE,
    MOCK_QUEUE_INFO,
    MOCK_SEARCH_COURSE_PRIORITY_INFO_RESULT,
    MOCK_SEARCH_COURSE_PRIORITY_META,
    MOCK_SELECTED_COURSES,
} from "../mocks/cr";
type TagElement = Element & {type: ElementType.Tag};
import dayjs from "dayjs";
import {CheerioAPI} from "cheerio";

export const getCrTimetable = (helper: InfoHelper): Promise<CrTimetable[]> => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        const {object} = await uFetch(`${DEADLINE_URL}?_csrf=${await getCsrfToken()}`).then(JSON.parse);
        const events: CrTimetableEvent[] = object.map((event: {djsbt: string, djskssj: number, djsjzsj: number, djsurl: string}) => ({
            stage: event.djsbt,
            begin: dayjs(event.djskssj).format("YYYY-MM-DD HH:mm"),
            end: dayjs(event.djsjzsj).format("YYYY-MM-DD HH:mm"),
            messages: [event.djsurl],
        }));
        return [{
            semester: "",
            undergraduate: true,
            graduate: true,
            events,
        }];
    },
    MOCK_CR_TIMETABLE,
);

export const getCrCaptchaUrl = (helper: InfoHelper) => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        const crLoginHomeContent = await uFetch(CR_LOGIN_HOME_URL);
        if (!crLoginHomeContent.includes("captchaflag")) {
            throw new LibError();
        }
        return CR_CAPTCHA_URL;
    },
    CR_CAPTCHA_URL,
);

export const loginCr = async (helper: InfoHelper) => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        throw new LibError("The method `loginCr' is obsolete.");
    },
    undefined,
);

/**
 * Fetch for course registration module.
 *
 * NOTE: If a <code>CrError</code> is caught by <code>roamingWrapperWithMocks</code>,
 *       WebVPN re-login will not be invoked.
 *
 * @param url  url of the request
 * @param post  post object, if not <code>undefined</code>
 * @param paramEncoding  encoding of post param
 */
const crFetch = async (
    url: string,
    post?: object,
    paramEncoding = "UTF-8",
): Promise<string> => {
    const result = await uFetch(url, post, 60000, paramEncoding);
    if (result.includes("needCaptcha")) {
        throw new LibError();
    }
    if (result.includes("用户登陆超时或访问内容不存在。请重试")) {
        throw new CrTimeoutError("用户登陆超时或访问内容不存在。请重试");
    }
    return result;
};

export const getCrAvailableSemesters = async (helper: InfoHelper): Promise<CrSemester[]> => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        const root = await crFetch(helper.graduate() ? CR_MAIN_YJS_URL : CR_MAIN_URL);
        const baseSemIdRes = /m=showTree&p_xnxq=(\d\d\d\d-\d\d\d\d-\d)/.exec(root);
        if (baseSemIdRes === null) {
            throw new CrError();
        }
        const $ = await crFetch((helper.graduate() ? CR_TREE_YJS_URL : CR_TREE_URL) + baseSemIdRes[1]).then(cheerio.load);
        return $("option").toArray().map((e) => ({
            id: (e as TagElement).attribs.value,
            name: ((e as TagElement).children[0] as DataNode).data?.trim(),
        } as CrSemester));
    },
    MOCK_AVAILABLE_SEMESTERS,
);

export const getCoursePlan = async (helper: InfoHelper, semester: string) => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        const data = await crFetch(helper.graduate() ? COURSE_PLAN_YJS_URL : COURSE_PLAN_URL_PREFIX + semester);
        const courses = cheerio.load(data)(".trr2");
        const result: CoursePlan[] = [];
        courses.each((_, element) => {
            if (element.type === "tag") {
                const rawItems = cheerio.load(element)("td");
                const items = rawItems.length === 7 ? rawItems.slice(2) : rawItems;
                if (helper.graduate()) {
                    result.push({
                        id: getCheerioText(items[1], 0),
                        name: (items[2] as TagElement).attribs.title,
                        property: getCheerioText(items[5], 0),
                        credit: Number(getCheerioText(items[3], 0)),
                        group: getCheerioText(items[6], 0),
                    });
                } else {
                    result.push({
                        id: getCheerioText(items[0], 1),
                        name: cheerio.load(items[1]).text().trim(),
                        property: getCheerioText(items[2], 1),
                        credit: Number(getCheerioText(items[3], 1)),
                        group: getCheerioText(items[4], 1),
                    });
                }
            }
        });
        return result;
    },
    MOCK_COURSE_PLAN,
);

const getText = (e: Element) => {
    return cheerio.load(e).text().trim();
};

const parseFooter = ($: CheerioAPI) => {
    const footer = $("p.yeM").toArray()[0] as TagElement;
    if (!footer) {
        return [0, 0, 0];
    }
    const footerText = ((footer.children[5] as DataNode).data as string).trim().replace(/,/g, "");
    const regResult = /第 (\d+) ?页 \/ 共 (\d+) 页（共 (\d+) 条记录）/.exec(footerText);
    if (regResult === null || regResult.length !== 4) {
        throw new CrError("cannot parse cr remaining footer data");
    }
    return regResult.slice(1, 4).map(s => Number(s));
};

export const searchCrRemaining = async (helper: InfoHelper, {
    page,
    semester,
    id,
    name,
    dayOfWeek,
    period
}: SearchParams): Promise<CrRemainingSearchResult> => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        const $ = await crFetch(helper.graduate() ? CR_SEARCH_YJS_URL : CR_SEARCH_URL, {
            m: "kylSearch",
            page: page ?? -1,
            "p_sort.p1": "",
            "p_sort.p2": "",
            "p_sort.asc1": "true",
            "p_sort.asc2": "true",
            p_xnxq: semester,
            pathContent: "课余量查询",
            p_kch: id ?? "",
            p_kxh: "",
            p_kcm: name ?? "",
            p_skxq: dayOfWeek ?? "",
            p_skjc: period ?? "",
            goPageNumber: page ?? 1,
        }, "GBK").then(cheerio.load);
        const [currPage, totalPage, totalCount] = parseFooter($);
        const courses = $(".trr2").toArray().map((e) => {
            const items = cheerio.load(e)("td");
            const hasQueueInfo = items.length == 8;
            return {
                id: getText(items[0]),
                seq: Number(getText(items[1])),
                name: getText(items[2]),
                capacity: Number(getText(items[3])),
                remaining: Number(getText(items[4])),
                queue: hasQueueInfo ? Number(getText(items[5])) : 0,
                teacher: getText(items[hasQueueInfo ? 6 : 5]),
                time: getText(items[hasQueueInfo ? 7 : 6]),
            } as CrRemainingInfo;
        });
        return {
            currPage,
            totalPage,
            totalCount,
            courses,
        };
    },
    MOCK_CR_REMAINING_SEARCH_RESULT,
);

export const searchCrPrimaryOpen = async (helper: InfoHelper, {
    page,
    semester,
    id,
    name,
    dayOfWeek,
    period
}: SearchParams): Promise<CrPrimaryOpenSearchResult> => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        const $ = await crFetch(helper.graduate() ? CR_SEARCH_YJS_URL : CR_SEARCH_URL, {
            m: "kkxxSearch",
            page: page ?? -1,
            "p_sort.p1": "",
            "p_sort.p2": "",
            "p_sort.asc1": "true",
            "p_sort.asc2": "true",
            p_xnxq: semester,
            pathContent: "一级课开课信息",
            showtitle: "",
            p_rxklxm: "",
            p_kch: id ?? "",
            p_kcm: name ?? "",
            p_zjjsxm: "",
            p_kkdwnm: "",
            p_kcflm: "",
            p_skxq: dayOfWeek ?? "",
            p_skjc: period ?? "",
            p_xkwzsm: "",
            p_kctsm: "",
            p_ssnj: "",
            goPageNumber: page ?? 1,
        }, "GBK").then(cheerio.load);
        const [currPage, totalPage, totalCount] = parseFooter($);
        const courses = $(".trr2").toArray().map((e) => {
            const items = cheerio.load(e)("td");
            return {
                department: getText(items[0]),
                id: getText(items[1]),
                seq: Number(getText(items[2])),
                name: getText(items[3]),
                credits: Number(getText(items[4])),
                teacher: getText(items[5]),
                bksCap: Number(getText(items[6])),
                yjsCap: Number(getText(items[8])),
                time: getText(items[10]),
                note: getText(items[11]),
                feature: getText(items[12]),
                year: getText(items[13]),
                secondary: getText(items[14]),
                reUseCap: getText(items[16]),
                restrict: getText(items[17]),
                culture: getText(items[18]),
            } as CrPrimaryOpenInfo;
        });
        return {
            currPage,
            totalPage,
            totalCount,
            courses,
        };
    },
    MOCK_CR_PRIMARY_OPEN_SEARCH_RESULT,
);

export const searchCrCourses = async (helper: InfoHelper, params: SearchParams): Promise<CrSearchResult> => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        const [remaining, primaryOpen] = await Promise.all([searchCrRemaining(helper, params), searchCrPrimaryOpen(helper, params)]);
        return {
            currPage: primaryOpen.currPage,
            totalPage: primaryOpen.totalPage,
            totalCount: primaryOpen.totalCount,
            courses: primaryOpen.courses.map((e) => {
                const remainingInfo = remaining.courses.find((r) => r.id === e.id);
                return {
                    ...e,
                    capacity: remainingInfo?.capacity ?? NaN,
                    remaining: remainingInfo?.remaining ?? NaN,
                    queue: remainingInfo?.queue ?? NaN,
                };
            }),
        };
    },
    MOCK_CR_SEARCH_RESULT,
);

export type Priority = "bx" | "xx" | "rx" | "ty" | "xwk" | "fxwk" | "tyk" | "cx"; // 必修|限选|任选|体育（本）|学位课|非学位课|体育课（研）|重修（本研）

export const selectCourse = async (helper: InfoHelper, semesterId: string, priority: Priority, courseId: string, courseSeq: string, will: 1 | 2 | 3) => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        const mainHtml = await crFetch(`${helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL}?m=${priority}Search&p_xnxq=${semesterId}&tokenPriFlag=${priority}`);
        const $ = cheerio.load(mainHtml);
        const m = `save${priority[0].toUpperCase()}${priority[1]}Kc`;
        const token = $("input[name=token]").attr()!.value;
        const post: { [key: string]: string | number } = {
            m,
            token,
            p_xnxq: semesterId,
            tokenPriFlag: priority,
        };
        const fieldKey = priority === "rx" ? "rx" : priority === "ty" ? "rxTy" : priority + "k";
        post[`p_${fieldKey}_id`] = `${semesterId};${courseId};${courseSeq};`;
        post[`p_${fieldKey}_xkzy`] = will;
        const responseHtml = await crFetch(helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL, post);
        const responseMsg = /showMsg\("(.+?)"\);/g.exec(responseHtml);
        if (responseMsg === null) {
            throw new CrError("Failed to match regex");
        }
        return responseMsg[1];
    },
    "提交选课成功;",
);

export const deleteCourse = async (helper: InfoHelper, semesterId: string, courseId: string, courseSeq: string) => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        const yxHtml = await crFetch(`${helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL}?m=yxSearchTab&p_xnxq=${semesterId}&tokenPriFlag=yx`);
        const $ = cheerio.load(yxHtml);
        const post: { [key: string]: string | number } = {
            m: "deleteYxk",
            token: $("input[name=token]").attr()!.value,
            p_xnxq: semesterId,
            tokenPriFlag: "yx",
        };
        post["p_del_id"] = `${semesterId};${courseId};${courseSeq};`;
        const responseHtml = await crFetch(helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL, post);
        const responseMsg = /showMsg\("(.+?)"\);/g.exec(responseHtml);
        if (responseMsg === null) {
            throw new CrError("Failed to match regex");
        }
        return responseMsg[1];
    },
    "删除选课成功",
);

const willStringToNumber = (will: string): 1 | 2 | 3 => {
    switch (will) {
    case "第一志愿":
        return 1;
    case "第二志愿":
        return 2;
    default:
        return 3;
    }
};

export const getSelectedCourses = async (helper: InfoHelper, semesterId: string): Promise<SelectedCourse[]> => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        const yxHtml = await crFetch(`${helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL}?m=yxSearchTab&p_xnxq=${semesterId}&tokenPriFlag=yx`);
        const $ = cheerio.load(yxHtml);
        return $(".trr2").map((_, e) => {
            const tds = cheerio.load(e)(".tdd2");
            return {
                type: cheerio.load(tds[1]).text(),
                will: willStringToNumber(cheerio.load(tds[2]).text()),
                id: cheerio.load(tds[3]).text(),
                seq: cheerio.load(tds[5]).text(),
                name: cheerio.load(tds[4]).text().trim(),
                time: cheerio.load(tds[6]).text(),
                teacher: cheerio.load(tds[7]).text(),
                credit: Number(cheerio.load(tds[8]).text()),
                secondary: cheerio.load(tds[9]).text() === "是",
            } as SelectedCourse;
        }).get();
    },
    MOCK_SELECTED_COURSES,
);

export const changeCourseWill = async (helper: InfoHelper, semesterId: string, courseId: string, courseSeq: string, will: 1 | 2 | 3) => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        const yxHtml = await crFetch(`${helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL}?m=yxSearchTab&p_xnxq=${semesterId}&tokenPriFlag=yx`);
        const $ = cheerio.load(yxHtml);
        const responseHtml = await crFetch(helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL, {
            m: "changeZY",
            token: $("input[name=token]").attr()!.value,
            p_xnxq: semesterId,
            tokenPriFlag: "yx",
            jhzy_kch: courseId,
            jhzy_kxh: courseSeq,
            jhzy_zy: will,
        });
        const responseMsg = /showMsg\("(.+?)"\);/g.exec(responseHtml);
        if (responseMsg === null) {
            throw new CrError("Failed to match regex");
        }
        return responseMsg[1];
    },
    "该修改志愿成功",
);

export const getCrCurrentStage = async (
    helper: InfoHelper,
    semesterId: string,
): Promise<{
    stage: string;
    beginTime: string;
    endTime: string;
}> => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        const html = await crFetch(`${helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL}?m=selectKc&p_xnxq=${semesterId}&pathContent=%D2%BB%BC%B6%D1%A1%BF%CE`);
        const stageRes = /"当前选课阶段：(.+?)&nbsp;&nbsp;"/.exec(html);
        const beginRes = /"(.+?)开始&nbsp;&nbsp;"/.exec(html);
        const endRes = /"(.+?)结束"/.exec(html);
        if (stageRes === null || beginRes === null || endRes === null) {
            throw new CrError("Failed to match regex");
        }
        return {
            stage: stageRes[1],
            beginTime: beginRes[1],
            endTime: endRes[1],
        };
    },
    MOCK_CR_CURRENT_STAGE,
);

export const searchCoursePriorityMeta = async (
    helper: InfoHelper,
    semesterId: string,
): Promise<{ curr: string, next: string }> => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        const $ = cheerio.load(await crFetch(`${helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL}?m=xkqkSearch&p_xnxq=${semesterId}`));
        const pad = $(".pad");
        return {
            curr: pad.find("font").text(),
            next: ((pad[0] as TagElement).children[5] as DataNode).data?.trim() ?? "",
        };
    },
    MOCK_SEARCH_COURSE_PRIORITY_META,
);

export const searchCoursePriorityInformation = async (
    helper: InfoHelper,
    semesterId: string,
    query: SearchCoursePriorityQuery,
): Promise<SearchCoursePriorityResult[]> => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        const responseHtml = await (async () => {
            const tag = query.isSports ? "Ty" : "BR";
            if (query.selected) {
                return await crFetch(`${helper.graduate() ? CR_ZYTJB_YJS_URL : CR_ZYTJB_URL}?m=tbzySearch${tag}&p_xnxq=${semesterId}&type=GR`);
            } else {
                const xkHtml = await crFetch(`${helper.graduate() ? CR_ZYTJB_YJS_URL : CR_ZYTJB_URL}?m=tbzySearch${tag}&p_xnxq=${semesterId}`);
                const $ = cheerio.load(xkHtml);
                return await crFetch(helper.graduate() ? CR_ZYTJB_YJS_URL : CR_ZYTJB_URL, {
                    m: `tbzySearch${tag}`,
                    page: query.page ?? -1,
                    token: $("input[name=token]").attr()!.value,
                    p_xnxq: semesterId,
                    tokenPriFlag: query.isSports ? undefined : "yx",
                    p_kch: query.courseId ?? "",
                    p_kxh: query.courseSeq ?? "",
                    p_kcm: query.courseName ?? "",
                    p_lrdwnm: query.departmentId ?? "",
                    p_tbzyType: query.isSports ? "tbzySearchTy" : undefined,
                }, "GBK");
            }
        })();
        const $ = cheerio.load(responseHtml);
        const parseSelectedCount = (s: string): [number, number, number, number] => {
            const pri = Number(/\((\d+)\)/.exec(s)?.[1] ?? 0);
            const data = /(\d+),(\d+),(\d+)/.exec(s);
            if (data === null || data.length < 4) {
                throw new CrError("Failed to parse selected count (regex parse error)");
            }
            return [pri, Number(data[1]), Number(data[2]), Number(data[3])];
        };
        return $("#content_1 tr").map((_, e) => {
            const tds = cheerio.load(e)("td");
            return {
                courseId: cheerio.load(tds[0]).text(),
                courseSeq: cheerio.load(tds[1]).text(),
                courseName: cheerio.load(tds[2]).text(),
                departmentName: query.isSports ? "" : cheerio.load(tds[3]).text(),
                capacity: Number(cheerio.load(tds[query.isSports ? 3 : 4]).text()),
                bxSelected: query.isSports ? [0, 0, 0, 0] : parseSelectedCount(cheerio.load(tds[6]).text()),
                xxSelected: query.isSports ? [0, 0, 0, 0] : parseSelectedCount(cheerio.load(tds[7]).text()),
                rxSelected: parseSelectedCount(cheerio.load(tds[query.isSports ? 5 : 8]).text()),
            } as SearchCoursePriorityResult;
        }).get();
    },
    MOCK_SEARCH_COURSE_PRIORITY_INFO_RESULT,
);

export const getQueueInfo = async (
    helper: InfoHelper,
    semesterId: string,
): Promise<QueueInfo[]> => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        const data = await crFetch(`${helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL}?m=dlSearch&p_xnxq=${semesterId}&pathContent=%B6%D3%C1%D0%D0%C5%CF%A2%B2%E9%D1%AF`);
        const courses = cheerio.load(data)(".trr2");
        const result: QueueInfo[] = [];
        courses.each((_, e) => {
            const tds = cheerio.load(e)("td");
            result.push({
                property: cheerio.load(tds[0]).text().trim(),
                will: willStringToNumber(cheerio.load(tds[1]).text()),
                courseId: cheerio.load(tds[2]).text(),
                courseSeq: cheerio.load(tds[4]).text(),
                courseName: cheerio.load(tds[3]).text().trim(),
                inQueue: Number(cheerio.load(tds[5]).text()),
                position: Number(cheerio.load(tds[6]).text()),
                time: cheerio.load(tds[7]).text(),
                teacher: cheerio.load(tds[8]).text(),
            });
        });
        return result;
    },
    MOCK_QUEUE_INFO,
);

export const cancelCoursePF = async (
    helper: InfoHelper,
    semesterId: string,
    courseId: string,
): Promise<void> => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        await crFetch(`${helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL}?m=pfkcxz&p_xnxq=${semesterId}`);
        const pfHtml = await crFetch(`${helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL}?m=yxpfxz&p_xnxq=${semesterId}&tokenPriFlag=yx`);
        const $ = cheerio.load(pfHtml);
        const token = $("input[name=token]").attr()!.value;
        const availableCourses = $(".xinXi2 > #content_1 .table1 tr");
        for (const course of availableCourses) {
            const items = cheerio.load(course)("td");
            if (getCheerioText(items[1], 0) === courseId) {
                const post: { [key: string]: string } = {};
                $("form[name=frm] input[type=hidden]").each((_, e) => {
                    if (e.type === "tag") {
                        post[e.attribs.name] = e.attribs.value;
                    }
                });
                post.token = token;
                post.m = "editpfcancle";
                const result = await crFetch(helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL, post);
                if (!result.includes("showMsg(\"任选课取消置为P/F成功\");")) {
                    throw new CrError(`Failed to cancel PF for course #${courseId}`);
                }
                return;
            }
        }
        throw new CrError(`Cannot find course with ID ${courseId}`);
    },
    undefined,
);


export const setCoursePF = async (
    helper: InfoHelper,
    semesterId: string,
    courseId: string,
): Promise<void> => roamingWrapperWithMocks(
    helper,
    "cr",
    "",
    async () => {
        await crFetch(`${helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL}?m=pfkcxz&p_xnxq=${semesterId}`);
        const pfHtml = await crFetch(`${helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL}?m=yxpfxz&p_xnxq=${semesterId}&tokenPriFlag=yx`);
        const $ = cheerio.load(pfHtml);
        const token = $("input[name=token]").attr()!.value;
        const availableCourses = $(".tabdiv #content_1 .table1 tr");
        for (const course of availableCourses) {
            const items = cheerio.load(course)("td");
            if (getCheerioText(items[2], 0) === courseId) {
                const pfRadio = cheerio.load(items[0])("input[type=radio]");
                if (pfRadio.length === 0) {
                    throw new CrError(`Course #${courseId} cannot be set PF`);
                }
                const post: { [key: string]: string } = {};
                $("form[name=frm] input[type=hidden]").each((_, e) => {
                    if (e.type === "tag") {
                        post[e.attribs.name] = e.attribs.value;
                    }
                });
                post.p_pf_id = pfRadio.first().attr()!.value;
                post.token = token;
                post.m = "editpfyes";
                const result = await crFetch(helper.graduate() ? CR_SELECT_YJS_URL : CR_SELECT_URL, post);
                if (!result.includes("showMsg(\"任选课置为P/F成功\")")) {
                    throw new CrError(`Failed to set PF for course #${courseId}`);
                }
                return;
            }
        }
        throw new CrError(`Cannot find course with ID ${courseId}`);
    },
    undefined,
);
