/* eslint-disable quotes */
import {jsPDF} from 'jspdf';
import imageSize from "../utils/image-size";
import {roamingWrapperWithMocks} from "./core";
import {RESERVES_LIB_SEARCH, RESERVES_LIB_DETAIL, ID_BASE_URL, ID_LOGIN_URL} from "../constants/strings";
import {SearchResultItem, SearchResult, BookChapter, BookDetail} from "../models/home/reserves-lib";
import cheerio from "cheerio";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import fetch from "cross-fetch";
import {MOCK_RESERVES_LIB_SEARCH} from "../mocks/reserves-lib";
import {IdAuthError} from '../utils/error';

const reservesLibLogin = async (helper: InfoHelper) => {
    await uFetch(ID_BASE_URL + "5bf6e5a699d63ff1cdb082836ebd50f9");
    let response = await uFetch(ID_LOGIN_URL, {
        i_user: helper.userId,
        i_pass: helper.password,
        i_captcha: "",
    });
    if (!response.includes("登录成功。正在重定向到")) {
        await uFetch(ID_BASE_URL + "5bf6e5a699d63ff1cdb082836ebd50f9");
        response = await uFetch(ID_LOGIN_URL, {
            i_user: helper.userId,
            i_pass: helper.password,
            i_captcha: "",
        });
        if (!response.includes("登录成功。正在重定向到")) {
            throw new IdAuthError();
        }
    }
    const redirectUrl = cheerio("a", response).attr().href;
    return await uFetch(redirectUrl);
};

const encodeBookName = (bookName: string): string => {
    let result = '';
    for (let i = 0; i < bookName.length; ++i) {
        const unicode = bookName.charCodeAt(i);
        result += unicode < 128 ? bookName.charAt(i) : '%u' + unicode.toString(16).toUpperCase();
    }
    return result;
};

export const searchReservesLib = (helper: InfoHelper, bookName: string, page?: number): Promise<SearchResult> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "5bf6e5a699d63ff1cdb082836ebd50f9",
        () => uFetch(`${RESERVES_LIB_SEARCH}?bookName=${encodeBookName(bookName)}${page ? '&page=' + page : ''}`).then(response => {
            const $ = cheerio.load(response);
            const books = $(".p-fbox");
            if (books.length === 0) {
                // 无结果
                return MOCK_RESERVES_LIB_SEARCH;
            }
            // @ts-ignore
            const [, bookCount, pageCount] = /共\s*(\d+)\s*条结果,(\d+)\s*页/.exec($('.s-list .btns').html());
            const data = [] as SearchResultItem[];
            for (let i = 0; i < books.length; ++i) {
                const book = books.eq(i).html() as string;
                data.push({
                    bookId: /bookId=(.*?)"/.exec(book)?.[1] as string,
                    img: `https://webvpn.tsinghua.edu.cn${/img.*?src="(.*?)"/.exec(book)?.[1] ?? ''}`,
                    title: /<strong>(.*)<\/strong>/.exec(book)?.[1] as string,
                    ISBN: /ISBN：(.*)<\/p>/.exec(book)?.[1] as string,
                    author: /责任者：(.*)<\/p>/.exec(book)?.[1] as string,
                    publisher: /出版项：(.*)<\/p>/.exec(book)?.[1]?.replace('&nbsp;', ' ') as string
                });
            }
            return {
                bookCount: Number(bookCount),
                pageCount: Number(pageCount),
                data,
            };
        }),
        MOCK_RESERVES_LIB_SEARCH
    );

export const bookDetail = (helper: InfoHelper, bookId: string): Promise<BookDetail | undefined> =>
    roamingWrapperWithMocks<BookDetail | undefined>(
        helper,
        undefined,
        "5bf6e5a699d63ff1cdb082836ebd50f9",
        () => uFetch(`${RESERVES_LIB_DETAIL}?bookId=${bookId}`).then(async (response) => {
            if (response.includes('请您登录个人INFO账户查看教参全文')) {
                await reservesLibLogin(helper);
                response = await uFetch(`${RESERVES_LIB_DETAIL}?bookId=${bookId}`);
            }
            const $ = cheerio.load(response);
            const tr = $('tbody').find('tr');
            const chapterInfo = $('.p-result p').eq(1).find('a');
            const chapters: BookDetail["chapters"] = [];
            for (let i = 0; i < chapterInfo.length; ++i) {
                chapters.push({
                    title: chapterInfo.eq(i).html() as string,
                    // @ts-ignore
                    href: chapterInfo.eq(i)[0].attribs.href
                });
            }
            return {
                // @ts-ignore
                img: `https://webvpn.tsinghua.edu.cn${$('.p-result img')[0].attribs.src}` as string,
                title: tr.eq(0).find('font').eq(1).find('b').html()?.trim() as string,
                author: tr.eq(1).find('font').eq(1).html()?.trim() as string,
                publisher: tr.eq(2).find('font').eq(1).html()?.replace('&nbsp;', '').trim() as string,
                ISBN: tr.eq(3).find('font').eq(1).html()?.trim() as string,
                version: tr.eq(4).find('font').eq(1).html()?.trim() as string,
                volume: tr.eq(5).find('font').eq(1).html()?.trim() as string,
                chapters,
            };
        }),
        undefined,
    );

export const downloadChapters = async (chapters: BookChapter[], setCompletion?: (total: number, complete: number) => void): Promise<jsPDF> => {
    const chapterExp = /\/http\/77726476706e69737468656265737421e2f2529935266d43300480aed641303c455d43259619a3eaf6eebb99(.*)index.html/;
    const pageCountExp = /bookConfig.totalPageCount=(.*?);/;
    const configs = await Promise.all(
        chapters.map(async (chap) => ({
            url: chapterExp.exec(chap.href)?.[1] as string,
            length: Number(
                pageCountExp.exec(
                    await (
                        await fetch(
                            `https://reserves.lib.tsinghua.edu.cn${chapterExp.exec(chap.href)?.[1] as string}mobile/javascript/config.js`
                        )
                    ).text()
                )?.[1]
            ),
        }))
    );
    let doc: jsPDF | undefined = undefined;
    const total = configs.map((config) => config.length).reduce((a, b) => a + b);
    let complete = 0;
    setCompletion && setCompletion(total, complete);
    // 减小并发
    for (let chap = 0; chap < configs.length; ++chap) {
        const config = configs[chap];
        for (let page = 1; page <= config.length; ++page) {
            const img = await (await fetch(`https://reserves.lib.tsinghua.edu.cn${config.url}files/mobile/${page}.jpg`)).arrayBuffer();
            const size = imageSize(new Buffer(img)) as { width: number, height: number };
            if (!doc) {
                doc = new jsPDF({ format: [size.width, size.height], unit: 'px' });
            } else {
                doc.addPage([size.width, size.height]);
            }
            doc.addImage(new Uint8Array(img), 'JPEG', 0, 0, size.width, size.height);
            setCompletion && setCompletion(total, ++complete);
        }
    }
    return doc as jsPDF;
};
