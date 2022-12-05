import {InfoHelper} from "../index";
import {
    COURSE_PLAN_URL_PREFIX,
    CR_CAPTCHA_URL,
    CR_LOGIN_HOME_URL,
    CR_LOGIN_SUBMIT_URL,
    CR_MAIN_URL,
    CR_SEARCH_URL,
    CR_SELECT_URL,
    CR_TIMETABLE_URL,
    CR_TREE_URL,
    CR_ZYTJB_URL,
} from "../constants/strings";
import {uFetch} from "../utils/network";
import cheerio from "cheerio";
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
import {roamingWrapperWithMocks} from "./core";
import {CrCaptchaError, CrError, CrTimeoutError, LibError} from "../utils/error";
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
import TagElement = cheerio.TagElement;
import Element = cheerio.Element;
import TextElement = cheerio.TextElement;

const parseCrTimetableTime = (semester: string, timeText: string): string => {
    const timeSearch = /(\d+)月(\d+)日.+?(\d+):(\d+)/.exec(timeText);
    if (timeSearch === null) {
        throw new LibError("Failed to parse cr timetable time");
    }
    const [month, day, hour, minute] = timeSearch.slice(1);
    let year: string;
    const beginYear = semester.substring(0, 4);
    const endYear = semester.substring(5, 9);
    const semesterType = semester[10];
    if (semesterType === "1") {
        year = Number(month) < 3 ? endYear : beginYear;
    } else if (semesterType === "2") {
        year = Number(month) > 8 ? beginYear : endYear;
    } else {
        year = endYear;
    }
    return `${year}-${month}-${day} ${hour}:${minute}`;
};

export const getCrTimetable = (helper: InfoHelper): Promise<CrTimetable[]>  => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        const html = await uFetch(CR_TIMETABLE_URL);
        if (!html.includes("时间安排")) {
            throw new LibError();
        }
        const $ = cheerio.load(html);
        const result: CrTimetable[] = [];
        $("td > .MsoNormalTable").each((_, e) => {
            const table = cheerio(e);
            const rows = table.find("tr");
            const title = cheerio(rows[0]).text().trim();
            const [semesterText, flagText] = title.split("季学期 ");
            const semester = semesterText
                .replace("秋", "-1")
                .replace("春", "-2")
                .replace("夏", "-3");
            const undergraduate = flagText.includes("本");
            const graduate = flagText.includes("研");
            const events: CrTimetableEvent[] = [];
            let begin = "";
            let end = "";
            rows.slice(2).each((__, e2) => {
                const tds = cheerio(e2).children();
                const stage = tds.first().text().trim();
                const messages = tds.last().children().map((___, e3) => cheerio(e3).text()).get();
                if (tds.length === 3) {
                    const duration = cheerio(tds[1]).children().last().text();
                    if (duration === "待定") {
                        return;
                    }
                    const [beginText, endText] = duration.split("～");
                    begin = parseCrTimetableTime(semester, beginText);
                    end = parseCrTimetableTime(semester, endText);
                }
                events.push({stage, begin, end, messages});
            });
            result.push({
                semester,
                undergraduate,
                graduate,
                events,
            });
        });
        return result;
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

export const loginCr = async (helper: InfoHelper, captcha: string) => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        const res = await uFetch(CR_LOGIN_SUBMIT_URL, {
            j_username: helper.userId,
            j_password: helper.password,
            captchaflag: "login1",
            _login_image_: captcha.toUpperCase(),
        });
        if (res.includes("登录失败：验证码不正确！")) {
            throw new CrCaptchaError("登录失败：验证码不正确！");
        } else if (!res.includes("本科生选课") && !res.includes("研究生选课")) {
            throw new LibError();
        }
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
    undefined,
    "",
    async () => {
        const root = await crFetch(CR_MAIN_URL);
        const baseSemIdRes = /m=showTree&p_xnxq=(\d\d\d\d-\d\d\d\d-\d)/.exec(root);
        if (baseSemIdRes === null) {
            throw new CrError();
        }
        const $ = await crFetch(CR_TREE_URL + baseSemIdRes[1]).then(cheerio.load);
        return $("option").toArray().map((e) => ({
            id: (e as TagElement).attribs.value,
            name: ((e as TagElement).children[0] as TextElement).data?.trim(),
        } as CrSemester));
    },
    MOCK_AVAILABLE_SEMESTERS,
);

export const getCoursePlan = async (helper: InfoHelper, semester: string) => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        const data = await crFetch(COURSE_PLAN_URL_PREFIX + semester);
        const courses = cheerio(".trr2", data);
        const result: CoursePlan[] = [];
        courses.each((_, element) => {
            if (element.type === "tag") {
                const rawItems = cheerio(element).children();
                const items = rawItems.length === 7 ? rawItems.slice(2) : rawItems;
                result.push({
                    id: getCheerioText(items[0], 1),
                    name: cheerio(cheerio(cheerio(cheerio(items[1]).children()[0]).children()[0]).children()[0]).text().trim(),
                    property: getCheerioText(items[2], 1),
                    credit: Number(getCheerioText(items[3], 1)),
                    group: getCheerioText(items[4], 1),
                });
            }
        });
        return result;
    },
    MOCK_COURSE_PLAN,
);

const getText = (e: Element, index: number) => {
    return cheerio((e as TagElement).children[index]).text().trim();
};

const parseFooter = ($: cheerio.Root) => {
    const footerText = (($("p.yeM").toArray()[0] as TagElement).children[5].data as string).trim().replace(/,/g, "");
    const regResult = /第 (\d+) ?页 \/ 共 (\d+) 页（共 (\d+) 条记录）/.exec(footerText);
    if (regResult === null || regResult.length !== 4) {
        throw new CrError("cannot parse cr remaining footer data");
    }
    return regResult.slice(1, 4).map(s => Number(s));
};

export const searchCrRemaining = async (helper: InfoHelper, {page, semester, id, name, dayOfWeek, period}: SearchParams): Promise<CrRemainingSearchResult> => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        const $ = await crFetch(CR_SEARCH_URL, {
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
            return {
                id: getText(e, 1),
                seq: Number(getText(e, 3)),
                name: getText(e, 5),
                capacity: Number(getText(e, 7)),
                remaining: Number(getText(e, 9)),
                queue: Number(getText(e, 11)),
                teacher: getText(e, 13),
                time: getText(e, 15),
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

export const searchCrPrimaryOpen = async (helper: InfoHelper, {page, semester, id, name, dayOfWeek, period}: SearchParams): Promise<CrPrimaryOpenSearchResult> => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        const $ = await crFetch(CR_SEARCH_URL, {
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
            return {
                department: getText(e, 1),
                id: getText(e, 3),
                seq: Number(getText(e, 5)),
                name: getText(e, 7),
                credits: Number(getText(e, 9)),
                teacher: getText(e, 11),
                bksCap: Number(getText(e, 13)),
                yjsCap: Number(getText(e, 17)),
                time: getText(e, 21),
                note: getText(e, 23),
                feature: getText(e, 25),
                year: getText(e, 27),
                secondary: getText(e, 29),
                reUseCap: getText(e, 33),
                restrict: getText(e, 35),
                culture: getText(e, 37),
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
    undefined,
    "",
    async () => {
        const [remaining, primaryOpen] = await Promise.all([searchCrRemaining(helper, params), searchCrPrimaryOpen(helper, params)]);
        return {
            currPage: remaining.currPage,
            totalPage: remaining.totalPage,
            totalCount: remaining.totalCount,
            courses: primaryOpen.courses.map((e, i) => ({
                ...e,
                capacity: remaining.courses[i].capacity,
                remaining: remaining.courses[i].remaining,
                queue: remaining.courses[i].queue,
            })),
        };
    },
    MOCK_CR_SEARCH_RESULT,
);

export type Priority = "bx" | "xx" | "rx" | "ty" | "cx"

export const selectCourse = async (helper: InfoHelper, semesterId: string, priority: Priority, courseId: string, courseSeq: string, will: 1 | 2 | 3) => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        const mainHtml = await crFetch(`${CR_SELECT_URL}?m=${priority}Search&p_xnxq=${semesterId}&tokenPriFlag=${priority}`);
        const $ = cheerio.load(mainHtml);
        const m = `save${priority[0].toUpperCase()}${priority[1]}Kc`;
        const token = $("input[name=token]").attr().value;
        const post: {[key: string]: string | number} = {
            m,
            token,
            p_xnxq: semesterId,
            tokenPriFlag: priority,
        };
        const fieldKey = priority === "rx" ? "rx" : priority === "ty" ? "rxTy" : priority + "k";
        post[`p_${fieldKey}_id`] = `${semesterId};${courseId};${courseSeq};`;
        post[`p_${fieldKey}_xkzy`] = will;
        const responseHtml = await crFetch(CR_SELECT_URL, post);
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
    undefined,
    "",
    async () => {
        const yxHtml = await crFetch(`${CR_SELECT_URL}?m=yxSearchTab&p_xnxq=${semesterId}&tokenPriFlag=yx`);
        const $ = cheerio.load(yxHtml);
        const post: {[key: string]: string | number} = {
            m: "deleteYxk",
            token: $("input[name=token]").attr().value,
            p_xnxq: semesterId,
            tokenPriFlag: "yx",
        };
        post["p_del_id"] = `${semesterId};${courseId};${courseSeq};`;
        const responseHtml = await crFetch(CR_SELECT_URL, post);
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
    case "第一志愿": return 1;
    case "第二志愿": return 2;
    default: return 3;
    }
};

export const getSelectedCourses = async (helper: InfoHelper, semesterId: string): Promise<SelectedCourse[]> => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        const yxHtml = await crFetch(`${CR_SELECT_URL}?m=yxSearchTab&p_xnxq=${semesterId}&tokenPriFlag=yx`);
        const $ = cheerio.load(yxHtml);
        return $(".trr2").map((_, e) => {
            const tds = cheerio(e).find(".tdd2");
            return {
                type: cheerio(tds[1]).text(),
                will: willStringToNumber(cheerio(tds[2]).text()),
                id: cheerio(tds[3]).text(),
                seq: cheerio(tds[5]).text(),
                name: cheerio(tds[4]).text().trim(),
                time: cheerio(tds[6]).text(),
                teacher: cheerio(tds[7]).text(),
                credit: Number(cheerio(tds[8]).text()),
                secondary: cheerio(tds[9]).text() === "是",
            } as SelectedCourse;
        }).get();
    },
    MOCK_SELECTED_COURSES,
);

export const changeCourseWill = async (helper: InfoHelper, semesterId: string, courseId: string, courseSeq: string, will: 1 | 2 | 3) => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        const yxHtml = await crFetch(`${CR_SELECT_URL}?m=yxSearchTab&p_xnxq=${semesterId}&tokenPriFlag=yx`);
        const $ = cheerio.load(yxHtml);
        const responseHtml = await crFetch(CR_SELECT_URL, {
            m: "changeZY",
            token: $("input[name=token]").attr().value,
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
    undefined,
    "",
    async () => {
        const html = await crFetch(`${CR_SELECT_URL}?m=selectKc&p_xnxq=${semesterId}&pathContent=%D2%BB%BC%B6%D1%A1%BF%CE`);
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
    undefined,
    "",
    async () => {
        const $ = cheerio.load(await crFetch(`${CR_SELECT_URL}?m=xkqkSearch&p_xnxq=${semesterId}`));
        const pad = $(".pad");
        return {
            curr: pad.find("font").text(),
            next: (pad[0] as TagElement).children[5].data?.trim() ?? "",
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
    undefined,
    "",
    async () => {
        const responseHtml = await (async () => {
            const tag = query.isSports ? "Ty" : "BR";
            if (query.selected) {
                return await crFetch(`${CR_ZYTJB_URL}?m=tbzySearch${tag}&p_xnxq=${semesterId}&type=GR`);
            } else {
                const xkHtml = await crFetch(`${CR_ZYTJB_URL}?m=tbzySearch${tag}&p_xnxq=${semesterId}`);
                const $ = cheerio.load(xkHtml);
                return await crFetch(CR_ZYTJB_URL, {
                    m: `tbzySearch${tag}`,
                    page: query.page ?? -1,
                    token: $("input[name=token]").attr().value,
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
            const tds = cheerio(e).find("td");
            return {
                courseId: cheerio(tds[0]).text(),
                courseSeq: cheerio(tds[1]).text(),
                courseName: cheerio(tds[2]).text(),
                departmentName: query.isSports ? "" : cheerio(tds[3]).text(),
                capacity: Number(cheerio(tds[query.isSports ? 3 : 4]).text()),
                bxSelected: query.isSports ? [0, 0, 0, 0] : parseSelectedCount(cheerio(tds[6]).text()),
                xxSelected: query.isSports ? [0, 0, 0, 0] : parseSelectedCount(cheerio(tds[7]).text()),
                rxSelected: parseSelectedCount(cheerio(tds[query.isSports ? 5 : 8]).text()),
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
    undefined,
    "",
    async () => {
        const data = await crFetch(`${CR_SELECT_URL}?m=dlSearch&p_xnxq=${semesterId}&pathContent=%B6%D3%C1%D0%D0%C5%CF%A2%B2%E9%D1%AF`);
        const courses = cheerio(".trr2", data);
        const result: QueueInfo[] = [];
        courses.each((_, e) => {
            const tds = cheerio(e).find("td");
            result.push({
                property: cheerio(tds[0]).text().trim(),
                will: willStringToNumber(cheerio(tds[1]).text()),
                courseId: cheerio(tds[2]).text(),
                courseSeq: cheerio(tds[4]).text(),
                courseName: cheerio(tds[3]).text().trim(),
                inQueue: Number(cheerio(tds[5]).text()),
                position: Number(cheerio(tds[6]).text()),
                time: cheerio(tds[7]).text(),
                teacher: cheerio(tds[8]).text(),
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
    undefined,
    "",
    async () => {
        await crFetch(`${CR_SELECT_URL}?m=pfkcxz&p_xnxq=${semesterId}`);
        const pfHtml = await crFetch(`${CR_SELECT_URL}?m=yxpfxz&p_xnxq=${semesterId}&tokenPriFlag=yx`);
        const $ = cheerio.load(pfHtml);
        const token = $("input[name=token]").attr().value;
        const availableCourses = $(".xinXi2 > #content_1 .table1 tr");
        for (const course of availableCourses) {
            const items = cheerio(course).children("td");
            if (getCheerioText(items[1], 0) === courseId) {
                const post: {[key: string]: string} = {};
                $("form[name=frm] input[type=hidden]").each((_, e) => {
                    if (e.type === "tag") {
                        post[e.attribs.name] = e.attribs.value;
                    }
                });
                post.token = token;
                post.m = "editpfcancle";
                const result = await crFetch(CR_SELECT_URL, post);
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
    undefined,
    "",
    async () => {
        await crFetch(`${CR_SELECT_URL}?m=pfkcxz&p_xnxq=${semesterId}`);
        const pfHtml = await crFetch(`${CR_SELECT_URL}?m=yxpfxz&p_xnxq=${semesterId}&tokenPriFlag=yx`);
        const $ = cheerio.load(pfHtml);
        const token = $("input[name=token]").attr().value;
        const availableCourses = $(".tabdiv #content_1 .table1 tr");
        for (const course of availableCourses) {
            const items = cheerio(course).children("td");
            if (getCheerioText(items[2], 0) === courseId) {
                const pfRadio = cheerio(items[0]).children("input[type=radio]");
                if (pfRadio.length === 0) {
                    throw new CrError(`Course #${courseId} cannot be set PF`);
                }
                const post: {[key: string]: string} = {};
                $("form[name=frm] input[type=hidden]").each((_, e) => {
                    if (e.type === "tag") {
                        post[e.attribs.name] = e.attribs.value;
                    }
                });
                post.p_pf_id = pfRadio.first().attr().value;
                post.token = token;
                post.m = "editpfyes";
                const result = await crFetch(CR_SELECT_URL, post);
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
