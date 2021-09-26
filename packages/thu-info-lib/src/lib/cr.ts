import {InfoHelper} from "../index";
import {
    COURSE_PLAN_URL_PREFIX,
    CR_CAPTCHA_URL,
    CR_LOGIN_HOME_URL,
    CR_LOGIN_SUBMIT_URL,
    CR_SEARCH_URL,
} from "../constants/strings";
import {uFetch} from "../utils/network";
import cheerio from "cheerio";
import {CoursePlan, SearchParams} from "../models/cr/cr";
import {getCheerioText} from "../utils/cheerio";

export const getCrCaptchaUrlMethod = async () => {
    await uFetch(CR_LOGIN_HOME_URL);
    return CR_CAPTCHA_URL;
};

export const loginCr = async (helper: InfoHelper, captcha: string) => {
    const res = await uFetch(CR_LOGIN_SUBMIT_URL, CR_LOGIN_HOME_URL, {
        j_username: helper.emailName,
        j_password: helper.password,
        captchaflag: "login1",
        _login_image_: captcha.toUpperCase(),
    });
    if (!res.includes("本科生选课")) {
        throw new Error("Failed to login to course registration.");
    }
};

export const getCoursePlan = async (helper: InfoHelper, semester: string) => {
    const data = await uFetch(COURSE_PLAN_URL_PREFIX + semester);
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
};

export const searchCrRemaining = async (helper: InfoHelper, {page, semester, id, seq, name, dayOfWeek, period}: SearchParams) => {
    const result = await uFetch(CR_SEARCH_URL, CR_SEARCH_URL, {
        m: "kylSearch",
        page: page ?? -1,
        "p_sort.p1": "",
        "p_sort.p2": "",
        "p_sort.asc1": "true",
        "p_sort.asc2": "true",
        p_xnxq: semester,
        pathContent: "课余量查询",
        p_kch: id ?? "",
        p_kxh: seq ?? "",
        p_kcm: name ?? "",
        p_skxq: dayOfWeek ?? "",
        p_skjc: period ?? "",
        goPageNumber: page ?? 1,
    }, 60000, "GBK");
    console.error(result);
};
