import { InfoHelper } from "../index";
import {getCsrfToken, roamingWrapperWithMocks} from "../lib/core";
import { getRedirectUrl, uFetch } from "../utils/network";
import { NewsSlice, SourceTag } from "../models/news/news";
import { FILE_DOWNLOAD_URL, NEWS_ADD_FAVOR_URL, NEWS_DETAIL_URL, NEWS_FAVOR_LIST_URL, NEWS_LIST_URL, NEWS_REDIRECT_URL, NEWS_REMOVE_FAVOR_URL } from "../constants/strings";
import { newsHtml } from "../mocks/source/newsHtml";
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
export const getNewsList = async (helper: InfoHelper, page: number, length: number, channel?: SourceTag): Promise<NewsSlice[]> => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    async () => {
        const newsList: NewsSlice[] = [];
        const json = await uFetch(`${NEWS_LIST_URL}&lmid=${channel ?? "all"}&currentPage=${page}&length=${length}&_csrf=${await getCsrfToken()}`);
        const data: { object: { dataList: { bt: string, url: string, xxid: string, time: string, dwmc: string, yxzd: string, lmid: SourceTag }[] } } = JSON.parse(json);
        data.object.dataList.forEach(element => {
            newsList.push({
                name: decode(element.bt),
                xxid: (element.xxid),
                url: decode(element.url),
                date: element.time,
                source: element.dwmc,
                topped: element.yxzd.indexOf("1-") != -1 ? true : false,
                channel: element.lmid
            });
        });
        return newsList;
    },
    channel ? MOCK_NEWS_LIST(channel) : MOCK_NEWS_LIST("LM_JWGG").concat(MOCK_NEWS_LIST("LM_BGTG").concat(MOCK_NEWS_LIST("LM_HB"))),
);

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
    const xxid: string = /var xxid = "(.*?)";/.exec(html)?.[1] as string;
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
    if (helper.mocked()) return await getNewsDetailOld(helper, url);
    else if (url.includes("xxid")) return await handleNewApiNews(NEWS_REDIRECT_URL + url);
    else return await getNewsDetailOld(helper, await getRedirectUrl(NEWS_REDIRECT_URL + url));
};

const getNewsDetailOld = async (
    helper: InfoHelper,
    url: string,
): Promise<[string, string, string]> => {
    const [title, content] = getNewsDetailPolicy(url);
    const html = helper.mocked() ? newsHtml[url] ?? "" : await uFetch(url);
    if (title !== undefined && content) {
        const r = cheerio(content, html);
        return [
            cheerio(title, html).text(),
            r.html() ?? "",
            r.text().replace(/\s/g, ""),
        ];
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
    const data: { object: { totalPages: number, resultList: { bt: string, url: string, xxid: string, time: string, dwmc: string, lmid: SourceTag }[] } } = JSON.parse(json);
    data.object.resultList.forEach(element => {
        newsList.push({
            name: decode(element.bt),
            xxid: (element.xxid),
            url: decode(element.url),
            date: element.time,
            source: element.dwmc,
            topped: false,
            channel: element.lmid
        });
    });
    return [newsList, data.object.totalPages];
};
