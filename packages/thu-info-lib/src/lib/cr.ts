import {InfoHelper} from "../index";
import {
    COURSE_PLAN_URL_PREFIX,
    CR_CAPTCHA_URL,
    CR_LOGIN_HOME_URL,
    CR_LOGIN_SUBMIT_URL, CR_MAIN_URL,
    CR_SEARCH_URL, CR_TREE_URL,
} from "../constants/strings";
import {uFetch} from "../utils/network";
import cheerio from "cheerio";
import {
    CoursePlan,
    CrPrimaryOpenInfo,
    CrPrimaryOpenSearchResult,
    CrRemainingInfo,
    CrRemainingSearchResult,
    CrSearchResult, CrSemester,
    SearchParams,
} from "../models/cr/cr";
import {getCheerioText} from "../utils/cheerio";
import TagElement = cheerio.TagElement;
import Element = cheerio.Element;
import TextElement = cheerio.TextElement;
import {roamingWrapperWithMocks} from "./core";
import {CrCaptchaError, CrError, LibError} from "../utils/error";
import {
    MOCK_AVAILABLE_SEMESTERS,
    MOCK_COURSE_PLAN,
    MOCK_CR_PRIMARY_OPEN_SEARCH_RESULT,
    MOCK_CR_REMAINING_SEARCH_RESULT,
    MOCK_CR_SEARCH_RESULT,
} from "../mocks/cr";

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
        throw new CrError("用户登陆超时或访问内容不存在。请重试");
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
                yjsCap: Number(getText(e, 15)),
                time: getText(e, 17),
                note: getText(e, 19),
                feature: getText(e, 21),
                year: getText(e, 23),
                secondary: getText(e, 25),
                reUseCap: getText(e, 29),
                restrict: getText(e, 31),
                culture: getText(e, 33),
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
