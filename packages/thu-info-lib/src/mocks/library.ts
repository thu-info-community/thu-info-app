import {LibBookRecord, Library, LibraryFloor} from "../models/home/library";

export const MOCK_LIBRARY_LIST = [
    {
        enName: "Main Library North Section",
        enNameTrace: "Main Library North Section",
        id: 35,
        valid: true,
        zhName: "北馆(李文正馆)",
        zhNameTrace: "北馆(李文正馆)",
    },
    {
        enName: "Humanities and Social Sciences Library",
        enNameTrace: "Humanities and Social Sciences Library",
        id: 89,
        valid: true,
        zhName: "文科图书馆",
        zhNameTrace: "文科图书馆",
    },
] as Library[];

export const MOCK_LIBRARY_FLOOR_LIST = (id: number, dateChoice: 0 | 1): LibraryFloor[] => {
    if (id === 89 && dateChoice === 0) {
        return [
            {
                // @ts-ignore
                available: 0,
                enName: "1 st Floor",
                enNameTrace: "Humanities and Social Sciences Library - 1 st Floor",
                id: 90,
                parentId: 89,
                total: 76,
                valid: true,
                zhName: "一层 ",
                zhNameTrace: "文科图书馆 - 一层 ",
            },
            {
                // @ts-ignore
                available: 1,
                enName: "2 nd Floor",
                enNameTrace: "Humanities and Social Sciences Library - 2 nd Floor",
                id: 91,
                parentId: 89,
                total: 138,
                valid: true,
                zhName: "二层",
                zhNameTrace: "文科图书馆 - 二层",
            },
            {
                // @ts-ignore
                available: 0,
                enName: "3 rd Floor",
                enNameTrace: "Humanities and Social Sciences Library - 3 rd Floor",
                id: 92,
                parentId: 89,
                total: 172,
                valid: true,
                zhName: "三层",
                zhNameTrace: "文科图书馆 - 三层",
            },
            {
                // @ts-ignore
                available: 0,
                enName: "4 th Floor",
                enNameTrace: "Humanities and Social Sciences Library - 4 th Floor",
                id: 93,
                parentId: 89,
                total: 88,
                valid: true,
                zhName: "四层",
                zhNameTrace: "文科图书馆 - 四层",
            },
        ];
    } else if (id === 89 && dateChoice === 1) {
        return [
            {
                // @ts-ignore
                available: 8,
                enName: "1 st Floor",
                enNameTrace: "Humanities and Social Sciences Library - 1 st Floor",
                id: 90,
                parentId: 89,
                total: 76,
                valid: true,
                zhName: "一层 ",
                zhNameTrace: "文科图书馆 - 一层 ",
            },
            {
                // @ts-ignore
                available: 8,
                enName: "2 nd Floor",
                enNameTrace: "Humanities and Social Sciences Library - 2 nd Floor",
                id: 91,
                parentId: 89,
                total: 138,
                valid: true,
                zhName: "二层",
                zhNameTrace: "文科图书馆 - 二层",
            },
            {
                // @ts-ignore
                available: 0,
                enName: "3 rd Floor",
                enNameTrace: "Humanities and Social Sciences Library - 3 rd Floor",
                id: 92,
                parentId: 89,
                total: 172,
                valid: true,
                zhName: "三层",
                zhNameTrace: "文科图书馆 - 三层",
            },
            {
                // @ts-ignore
                available: 27,
                enName: "4 th Floor",
                enNameTrace: "Humanities and Social Sciences Library - 4 th Floor",
                id: 93,
                parentId: 89,
                total: 88,
                valid: true,
                zhName: "四层",
                zhNameTrace: "文科图书馆 - 四层",
            },
        ];
    } else if (id === 35 && dateChoice === 0) {
        return [
            {
                // @ts-ignore
                available: 0,
                enName: "1 st Floor",
                enNameTrace: "Main Library North Section - 1 st Floor",
                id: 36,
                parentId: 35,
                total: 33,
                valid: true,
                zhName: "一层",
                zhNameTrace: "北馆(李文正馆) - 一层",
            },
            {
                // @ts-ignore
                available: 1,
                enName: "2 nd Floor",
                enNameTrace: "Main Library North Section - 2 nd Floor",
                id: 37,
                parentId: 35,
                total: 312,
                valid: true,
                zhName: "二层",
                zhNameTrace: "北馆(李文正馆) - 二层",
            },
            {
                // @ts-ignore
                available: 0,
                enName: "3 rd Floor",
                enNameTrace: "Main Library North Section - 3 rd Floor",
                id: 38,
                parentId: 35,
                total: 266,
                valid: true,
                zhName: "三层",
                zhNameTrace: "北馆(李文正馆) - 三层",
            },
            {
                // @ts-ignore
                available: 0,
                enName: "4 th Floor",
                enNameTrace: "Main Library North Section - 4 th Floor",
                id: 39,
                parentId: 35,
                total: 240,
                valid: true,
                zhName: "四层",
                zhNameTrace: "北馆(李文正馆) - 四层",
            },
            {
                // @ts-ignore
                available: 0,
                enName: "5 th Floor",
                enNameTrace: "Main Library North Section - 5 th Floor",
                id: 40,
                parentId: 35,
                total: 100,
                valid: true,
                zhName: "五层",
                zhNameTrace: "北馆(李文正馆) - 五层",
            },
            {
                // @ts-ignore
                available: 0,
                enName: "G Floor",
                enNameTrace: "Main Library North Section - G Floor",
                id: 103,
                parentId: 35,
                total: 0,
                valid: false,
                zhName: "G层(现场选位)",
                zhNameTrace: "北馆(李文正馆) - G层(现场选位)",
            },
        ];
    } else if (id === 35 && dateChoice === 1) {
        return [
            {
                // @ts-ignore
                available: 17,
                enName: "1 st Floor",
                enNameTrace: "Main Library North Section - 1 st Floor",
                id: 36,
                parentId: 35,
                total: 33,
                valid: true,
                zhName: "一层",
                zhNameTrace: "北馆(李文正馆) - 一层",
            },
            {
                // @ts-ignore
                available: 148,
                enName: "2 nd Floor",
                enNameTrace: "Main Library North Section - 2 nd Floor",
                id: 37,
                parentId: 35,
                total: 312,
                valid: true,
                zhName: "二层",
                zhNameTrace: "北馆(李文正馆) - 二层",
            },
            {
                // @ts-ignore
                available: 129,
                enName: "3 rd Floor",
                enNameTrace: "Main Library North Section - 3 rd Floor",
                id: 38,
                parentId: 35,
                total: 266,
                valid: true,
                zhName: "三层",
                zhNameTrace: "北馆(李文正馆) - 三层",
            },
            {
                // @ts-ignore
                available: 128,
                enName: "4 th Floor",
                enNameTrace: "Main Library North Section - 4 th Floor",
                id: 39,
                parentId: 35,
                total: 240,
                valid: true,
                zhName: "四层",
                zhNameTrace: "北馆(李文正馆) - 四层",
            },
            {
                // @ts-ignore
                available: 6,
                enName: "5 th Floor",
                enNameTrace: "Main Library North Section - 5 th Floor",
                id: 40,
                parentId: 35,
                total: 16,
                valid: true,
                zhName: "五层",
                zhNameTrace: "北馆(李文正馆) - 五层",
            },
            {
                // @ts-ignore
                available: 0,
                enName: "G Floor",
                enNameTrace: "Main Library North Section - G Floor",
                id: 103,
                parentId: 35,
                total: 0,
                valid: false,
                zhName: "G层(现场选位)",
                zhNameTrace: "北馆(李文正馆) - G层(现场选位)",
            },
        ];
    } else {
        return [];
    }
};

export const MOCK_LIBRARY_ACCESS_TOKEN = "dummy";

export const MOCK_LIBRARY_BOOK_SEAT_RESPONSE = {status: 0, msg: "Testing account cannot book a seat."};

export const MOCK_LIBRARY_BOOKING_RECORDS = [
    {
        delId: undefined,
        id: "202009111837",
        pos: "文科图书馆-四层-C区:F4C083",
        status: "已使用",
        time: "2020-09-11 12:15:52",
    },
    {
        delId: undefined,
        id: "202009070209",
        pos: "文科图书馆-二层-A区:F2A008",
        status: "用户取消",
        time: "2020-09-08 08:00:00",
    },
    {
        delId: undefined,
        id: "202009062358",
        pos: "文科图书馆-三层-A区:F3A018",
        status: "已使用",
        time: "2020-09-07 08:00:00",
    },
    {
        delId: undefined,
        id: "202009021093",
        pos: "文科图书馆-三层-B区:F3B018",
        status: "已关闭",
        time: "2020-09-02 10:57:25",
    },
    {
        delId: undefined,
        id: "202008310485",
        pos: "北馆(李文正馆)-四层-B阅览区:NF4B093",
        status: "已使用",
        time: "2020-08-31 08:31:03",
    },
] as LibBookRecord[];
