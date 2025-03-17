/* eslint-disable quotes */
import {roamingWrapperWithMocks} from "./core";
import {RESERVES_LIB_SEARCH, RESERVES_LIB_DETAIL} from "../constants/strings";
import {SearchResultItem, SearchResult, BookChapter, BookDetail} from "../models/home/reserves-lib";
import * as cheerio from "cheerio";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {MOCK_RESERVES_LIB_SEARCH} from "../mocks/reserves-lib";
import {LibError} from '../utils/error';

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
        "id",
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
        "id",
        "5bf6e5a699d63ff1cdb082836ebd50f9",
        () => uFetch(`${RESERVES_LIB_DETAIL}?bookId=${bookId}`).then(async (response) => {
            if (response.includes('请您登录个人INFO账户查看教参全文')) {
                throw new LibError();
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const downloadChapters = async (chapters: BookChapter[], setCompletion?: (total: number, complete: number) => void): Promise<void> => {
    throw new LibError("downloadChapters is deprecated.");
};
