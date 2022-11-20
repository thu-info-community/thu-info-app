import { InfoHelper } from "../index";
import {getCsrfToken, roamingWrapperWithMocks} from "./core";
import { getRedirectUrl, uFetch } from "../utils/network";
import {NewsSlice, NewsSubscription, ChannelTag} from "../models/news/news";
import {
    FILE_DOWNLOAD_URL,
    NEWS_ADD_FAVOR_URL, NEWS_ADD_SUBSCRIPTION_URL, NEWS_CHANNEL_LIST_URL,
    NEWS_DETAIL_URL,
    NEWS_FAVOR_LIST_URL, NEWS_LIST_BY_SUBSCRIPTION_URL,
    NEWS_LIST_URL,
    NEWS_REDIRECT_URL,
    NEWS_REMOVE_FAVOR_URL, NEWS_REMOVE_SUBSCRIPTION_URL_FORMAT, NEWS_SOURCE_LIST_URL, NEWS_SUBSCRIPTION_LIST_URL,
    PDF_NEWS_PREFIX,
    SEARCH_NEWS_LIST_URL,
    SYSC_PDF_NEWS_PREFIX,
} from "../constants/strings";
import { newsHtml } from "../mocks/news";
import cheerio from "cheerio";
import { decode } from "he";
import {MOCK_NEWS_LIST} from "../mocks/news";

/**
 * Get News List
 * @param helper
 * @param page
 * @param length
 * @param channel
 * @returns Array of NewsSlice
 */
export const getNewsList = async (helper: InfoHelper, page: number, length: number, channel?: ChannelTag): Promise<NewsSlice[]> => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        const newsList: NewsSlice[] = [];
        const json = await uFetch(`${NEWS_LIST_URL}&lmid=${channel ?? "all"}&currentPage=${page}&length=${length}&_csrf=${await getCsrfToken()}`);
        const data: { object: { dataList: { bt: string, url: string, xxid: string, time: string, dwmc_show: string, yxzd: string, lmid: ChannelTag, sfsc:boolean }[] } } = JSON.parse(json);
        data.object.dataList.forEach(element => {
            newsList.push({
                name: decode(element.bt),
                xxid: (element.xxid),
                url: decode(element.url),
                date: element.time,
                source: element.dwmc_show,
                topped: element.yxzd.includes("1-"),
                channel: element.lmid,
                inFav:element.sfsc
            });
        });
        return newsList;
    },
    page !== 1 ? [] : channel ? MOCK_NEWS_LIST(channel) : MOCK_NEWS_LIST("LM_JWGG").concat(MOCK_NEWS_LIST("LM_BGTG").concat(MOCK_NEWS_LIST("LM_HB"))),
);

const channelToLmmc = (channel: ChannelTag): string => {
    switch (channel) {
    case "LM_BGTG": return "办公通知";
    case "LM_ZYGG": return "重要公告";
    case "LM_YQFKZT": return "疫情防控专题";
    case "LM_JWGG": return "教务通知";
    case "LM_KYTZ": return "科研通知";
    case "LM_HB": return "海报";
    case "LM_XJ_XTWBGTZ": return "校团委通知";
    case "LM_XSBGGG": return "学生工作通知";
    case "LM_TTGGG": return "图书馆信息";
    case "LM_JYGG": return "学生社区通知";
    case "LM_XJ_XSSQDT": return "学生社区动态";
    case "LM_BYJYXX": return "就业通知";
    case "LM_JYZPXX": return "招聘信息";
    case "LM_XJ_GJZZSXRZ": return "国际组织实习任职";
    }
};

/**
 * Search News List
 * @param helper
 * @param page
 * @param key
 * @param channel
 */
export const searchNewsList = async (helper: InfoHelper, page: number, key: string, channel?: ChannelTag): Promise<NewsSlice[]> => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        const newsList: NewsSlice[] = [];
        const json = await uFetch(
            `${SEARCH_NEWS_LIST_URL}?_csrf=${await getCsrfToken()}`,
            {esParamClass: JSON.stringify({
                params: { bt: key, tag: key, xxfl: key },
                filterParams: channel === undefined ? {} : { lmmcgroup: channelToLmmc(channel) },
                orderMap: { sort: "time" },
                matchExact: "否",
                currentPage: page,
            })},
        );
        const data: { object: { resultsList: { bt: string, url: string, xxid: string, time: string, dwmc_show: string, yxzd: null, lmid: ChannelTag, sfsc: boolean }[] } } = JSON.parse(json);
        data.object.resultsList.forEach(element => {
            newsList.push({
                name: cheerio.load(decode(element.bt)).root().text(),
                xxid: (element.xxid),
                url: decode(element.url),
                date: element.time,
                source: element.dwmc_show,
                topped: false,
                channel: element.lmid,
                inFav: element.sfsc,
            });
        });
        return newsList;
    },
    channel ? MOCK_NEWS_LIST(channel) : MOCK_NEWS_LIST("LM_JWGG").concat(MOCK_NEWS_LIST("LM_BGTG").concat(MOCK_NEWS_LIST("LM_HB"))),
);

export const getNewsSubscriptionList = async (helper: InfoHelper):Promise<NewsSubscription[]> => {
    const json = await uFetch(`${NEWS_SUBSCRIPTION_LIST_URL}?_csrf=${await getCsrfToken()}`);
    // I think the pxz is the order of subscriptions
    const data: { object: { id: string, fbdwmcList: string[], lmmcList: string[], pxz: number, titile: string }[] } = JSON.parse(json);
    return data.object.map((i) => {
        return {
            channel: i.lmmcList?.[0],
            source: i.fbdwmcList?.[0],
            id: i.id,
            title: i.titile,
            order: i.pxz,
        };
    });
};

export const getNewsSourceList = async (helper: InfoHelper): Promise<{ sourceId: string, sourceName: string }[]> => {
    const json = await uFetch(`${NEWS_SOURCE_LIST_URL}?_csrf=${await getCsrfToken()}`);
    const data: { object: { id: string, text: string }[] } = JSON.parse(json);
    return data.object.map(i => {
        return {
            sourceId: i.id,
            sourceName: i.text,
        };
    });
};

export const getNewsChannelList = async (h: InfoHelper, needEnglish: boolean): Promise<{ id: ChannelTag, title: string }[]> => {
    const json = await uFetch(`${NEWS_CHANNEL_LIST_URL}?_csrf=${await getCsrfToken()}`);
    const data: { object: { lmlist: { id: ChannelTag, title_zh: string, title_en: string }[] } } = JSON.parse(json);
    return data.object.lmlist.map(i => {
        return {
            id: i.id,
            title: needEnglish ? i.title_en : i.title_zh,
        };
    });
};

export const addNewsSubscription = async (h: InfoHelper, channelId?: ChannelTag, sourceId?: string): Promise<boolean> => {
    if (!channelId && !sourceId)
        return false;
    const json = await uFetch(`${NEWS_ADD_SUBSCRIPTION_URL}?_csrf=${await getCsrfToken()}`,
        {
            dygz: JSON.stringify({lmid: !channelId ? undefined : channelId, fbdwnm: !sourceId ? undefined : sourceId, bt: ""}),
            mkid: "XXFB",
        });
    const data: { result: string } = JSON.parse(json);
    return data.result === "success";
};

export const removeNewsSubscription = async (h: InfoHelper, subscriptionId: string): Promise<boolean> => {
    const json = await uFetch(NEWS_REMOVE_SUBSCRIPTION_URL_FORMAT.replace("{id}", subscriptionId).replace("{csrf}", await getCsrfToken()));
    const data: { result: string } = JSON.parse(json);
    return data.result === "success";
};

export const getNewsListBySubscription = async (h: InfoHelper, page: number, subscriptionId: string): Promise<NewsSlice[]> => {
    const json = await uFetch(`${NEWS_LIST_BY_SUBSCRIPTION_URL}?_csrf=${await getCsrfToken()}`,
        {
            "currentPage": page,
            "dyid": subscriptionId,
        });
    const data: { object: { resultList: { bt: string, url: string, xxid: string, time: string, dwmc_show: string, yxzd: string, lmid: ChannelTag, sfsc: boolean }[] } } = JSON.parse(json);
    const newsList: NewsSlice[] = [];
    // copy from line 37 to 47
    data.object.resultList.forEach(element => {
        newsList.push({
            name: decode(element.bt),
            xxid: (element.xxid),
            url: decode(element.url),
            date: element.time,
            source: element.dwmc_show,
            topped: false,
            channel: element.lmid,
            inFav: element.sfsc,
        });
    });
    return newsList;
};

const policyList: [string, [string, string]][] = [
    ["jwcbg", [".TD4", "td[colspan=4]:not(td[height])"]],
    [
        "kybg",
        [".style1", "table[width='95%'][cellpadding='3'] tr:nth(1)"],
    ],
    ["gjc", [".style11", "[width='85%'] td"]],
    [
        "77726476706e69737468656265737421f2fa598421322653770bc7b88b5c2d32530b094045c3bd5cabf3",
        [".TD1", "td[colspan=4]:not(td[height])"],
    ],
    [
        "77726476706e69737468656265737421e0f852882e3e6e5f301c9aa596522b2043f84ba24ebecaf8",
        [".cont_doc_box h5 span", "div.field-item"],
    ],
    [
        "77726476706e69737468656265737421e9fd528569336153301c9aa596522b20735d12f268e561f0",
        [
            "h3",
            "[style='text-align:left; width:90%; magin:0px auto; padding-top:20px;  padding-bottom:20px;word-break:break-all;']",
        ],
    ],
    [
        "77726476706e69737468656265737421f8e60f8834396657761d88e29d51367b523e",
        ["h1", ".r_cont > ul"],
    ],
    [
        "77726476706e69737468656265737421e8ef439b69336153301c9aa596522b20e1a870705b76e399",
        ["", ".td4"],
    ],
    ["rscbg", ["[height=40]", "[width='95%'] > tbody > tr:nth(3)"]],
    [
        "77726476706e69737468656265737421e7e056d234297b437c0bc7b88b5c2d3212b31e4d37621d4714d6",
        ["", "[style='text-align:left']"],
    ],
    ["ghxt", ["", "[valign=top]:not([class])"]],
    [
        "fgc",
        [
            ".title_b",
            "[style='width:647px;margin-left:6px;font-size:13px;line-height:20px;text-align:justify']",
        ],
    ],
    [
        "77726476706e69737468656265737421e8e442d23323615e79009cadd6502720f9b87b",
        [
            ".bt",
            ".xqbox",
        ],
    ],
    [
        "77726476706e69737468656265737421e4ff459d207e6b597d469dbf915b243de94c4812e5c2e1599f",
        [
            ".TD_right > font",
            "td[colspan=4]:not(td[height])",
        ],
    ],
    [
        "jdbsc",
        [
            ".TD1",
            "[width=95%]:nth-child(2) > tr:nth-child(1)",
        ],
    ],
    [
        "xsglxt",
        [
            ".sideleft p:first",
            ".sideleft",
        ],
    ],
    [
        "77726476706e69737468656265737421fdee49932a3526446d0187ab9040227bca90a6e14cc9",
        [
            "",
            ".box3 table",
        ],
    ],
    [
        "77726476706e69737468656265737421fcfe43d23323615e79009cadd6502720703f47",
        [
            "h2",
            "#vsb_content",
        ],
    ],
    [
        "77726476706e69737468656265737421f3f65399222226446d0187ab9040227b8e4026c4ffd2",
        [
            "h1",
            ".WordSection1",
        ],
    ],
];

const getNewsDetailPolicy = (
    url: string,
): [string | undefined, string | undefined] => {
    for (let i = 0; i < policyList.length; ++i) {
        if (url.indexOf(policyList[i][0]) !== -1) {
            return policyList[i][1];
        }
    }
    return [undefined, undefined];
};

const handleNewApiNews = async (url: string): Promise<[string, string, string]> => {
    const html = await uFetch(url);
    const csrf = await getCsrfToken();
    const xxid: string | undefined = /var xxid = "(.*?)";/.exec(html)?.[1] as string;
    if (xxid === undefined) {
        if (html.includes("_playFile")) {
            const redirectUrl = await getRedirectUrl(url);
            const fileIdPos = redirectUrl.indexOf("fileId=");
            const fileId = redirectUrl.substring(fileIdPos + 7);
            return await handlePdfNews(fileId);
        } else {
            return await getNewsDetailOld(await getRedirectUrl(url), false);
        }
    }
    const resp = await uFetch(`${NEWS_DETAIL_URL}?xxid=${xxid}&preview=&_csrf=${csrf}`);
    const data: { object: { xxDto: { bt: string, nr: string, fjs_template?: { wjid: string, wjmc: string }[] } } } = JSON.parse(resp);
    const title = decode(data.object.xxDto.bt);
    let content = "<div>" + decode(data.object.xxDto.nr);
    if (data.object.xxDto.fjs_template) {
        data.object.xxDto.fjs_template.forEach(file => {
            content += `<a href="${FILE_DOWNLOAD_URL + file.wjid}?_csrf=${csrf}">${file.wjmc}</a>`;
        });
    }
    content += "</div>";
    const jianjie = decode(data.object.xxDto.nr).replace(/<[^>]+>/g, "");
    return [title, content, jianjie];
};

export const getNewsDetail = async (helper: InfoHelper, url: string): Promise<[string, string, string]> => {
    if (helper.mocked()) return await getNewsDetailOld(url, true);
    else return await handleNewApiNews(NEWS_REDIRECT_URL + url);
};

const handlePdfNews = async (fileId: string): Promise<[string, string, string]> => {
    const pdf = await uFetch(PDF_NEWS_PREFIX + fileId + "?_csrf=" + await getCsrfToken());
    return ["PdF", pdf, "PdF"];
};

const getNewsDetailOld = async (
    url: string,
    mocked: boolean,
): Promise<[string, string, string]> => {
    const [title, content] = getNewsDetailPolicy(url);
    const html = mocked ? newsHtml[url] ?? "" : await uFetch(url);
    if (title !== undefined && content && !mocked) {
        const r = cheerio(content, html);
        return [
            cheerio(title, html).text(),
            r.html() ?? "",
            r.text().replace(/\s/g, ""),
        ];
    } else if (url.includes("77726476706e69737468656265737421e3f5468534367f1e6d119aafd641303ceb8f9190006d6afc78336870/#/publish")) {
        const id = url.substring(url.lastIndexOf("/") + 1);
        const result = await uFetch(SYSC_PDF_NEWS_PREFIX + id).then(JSON.parse);
        return ["PdF", result.content, "PdF"];
    } else {
        return ["", html, ""];
    }
};

export const addNewsToFavor = async (helper: InfoHelper, news: NewsSlice): Promise<boolean> => {
    const csrf = await getCsrfToken();
    const json = await uFetch(`${NEWS_ADD_FAVOR_URL}${news.xxid}?_csrf=${csrf}`);
    const data: { result: string } = JSON.parse(json);
    return data.result == "success";
};

export const removeNewsFromFavor = async (helper: InfoHelper, news: NewsSlice): Promise<boolean> => {
    const csrf = await getCsrfToken();
    const json = await uFetch(`${NEWS_REMOVE_FAVOR_URL}${news.xxid}?_csrf=${csrf}`);
    const data: { result: string } = JSON.parse(json);
    return data.result == "success";
};

export const getFavorNewsList = async (helper: InfoHelper, page = 1): Promise<[NewsSlice[], number]> => {
    const csrf = await getCsrfToken();
    const json = await uFetch(`${NEWS_FAVOR_LIST_URL}?_csrf=${csrf}`, { "currentPage": page });
    const newsList: NewsSlice[] = [];
    const data: { object: { totalPages: number, resultList: { bt: string, url: string, xxid: string, time: string, dwmc_show: string, lmid: ChannelTag, sfsc:boolean }[] } } = JSON.parse(json);
    data.object.resultList.forEach(element => {
        newsList.push({
            name: decode(element.bt),
            xxid: (element.xxid),
            url: decode(element.url),
            date: element.time,
            source: element.dwmc_show,
            topped: false,
            channel: element.lmid,
            inFav:element.sfsc
        });
    });
    return [newsList, data.object.totalPages];
};
