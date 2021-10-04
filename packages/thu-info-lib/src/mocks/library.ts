import {
    LibBookRecord,
    LibFuzzySearchResult,
    Library,
    LibraryFloor,
    LibRoomBookRecord,
    LibRoomRes,
} from "../models/home/library";

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

export const MOCK_LIB_ROOM_RES_LIST = [
    {
        id: "10352_10323",
        name: "F2-13",
        devId: 10352,
        devName: "F2-13",
        kindId: 10314,
        kindName: "文科馆团体研讨间-4人间8人间",
        classId: 10313,
        className: "文科馆团体研讨间-4人间8人间",
        labId: 10323,
        labName: "文科馆团体研讨间",
        roomId: 10351,
        roomName: "F2-13",
        buildingId: 0,
        buildingName: "",
        limit: 4,
        maxMinute: 240,
        minMinute: 30,
        cancelMinute: 20,
        maxUser: 4,
        minUser: 3,
        openStart: "08:00",
        openEnd: "22:00",
        usage: [{
            start: "18:00",
            end: "22:00",
            state: "undo",
            title: "张*",
            occupy: true
        },
        {
            start: "09:00",
            end: "13:00",
            state: "undo",
            title: "张*",
            occupy: true
        }]
    },
    {
        id: "2071787_2071770",
        name: "北馆2F-04",
        devId: 2071787,
        devName: "北馆2F-04",
        kindId: 2071757,
        kindName: "北馆团体研讨间",
        classId: 10313,
        className: "北馆团体研讨间",
        labId: 2071770,
        labName: "北馆团体间(二层)",
        roomId: 2071786,
        roomName: "北馆2F-04",
        buildingId: 0,
        buildingName: "",
        limit: 4,
        maxMinute: 240,
        minMinute: 30,
        cancelMinute: 20,
        maxUser: 10,
        minUser: 3,
        openStart: "08:00",
        openEnd: "22:00",
        usage: [{
            start: "17:00",
            end: "19:00",
            state: "undo",
            title: "张*",
            occupy: true
        },
        {
            start: "19:30",
            end: "21:30",
            state: "undo",
            title: "张*",
            occupy: true
        },
        {
            start: "10:00",
            end: "13:00",
            state: "undo",
            title: "张*",
            occupy: true
        }]
    },
    {
        id: "2071791_2071770",
        name: "北馆2F-03",
        devId: 2071791,
        devName: "北馆2F-03",
        kindId: 2071757,
        kindName: "北馆团体研讨间",
        classId: 10313,
        className: "北馆团体研讨间",
        labId: 2071770,
        labName: "北馆团体间(二层)",
        roomId: 2071790,
        roomName: "北馆2F-03",
        buildingId: 0,
        buildingName: "",
        limit: 4,
        maxMinute: 240,
        minMinute: 30,
        cancelMinute: 20,
        maxUser: 10,
        minUser: 3,
        openStart: "08:00",
        openEnd: "22:00",
        usage: [{
            start: "18:00",
            end: "21:00",
            state: "undo",
            title: "张*",
            occupy: true
        },
        {
            start: "13:10",
            end: "17:10",
            state: "undo",
            title: "张*",
            occupy: true
        },
        {
            start: "08:00",
            end: "09:30",
            state: "undo",
            title: "张*",
            occupy: true
        }]
    },
    {
        id: "10370_10323",
        name: "F2-16",
        devId: 10370,
        devName: "F2-16",
        kindId: 10314,
        kindName: "文科馆团体研讨间-4人间8人间",
        classId: 10313,
        className: "文科馆团体研讨间-4人间8人间",
        labId: 10323,
        labName: "文科馆团体研讨间",
        roomId: 10369,
        roomName: "F2-16",
        buildingId: 0,
        buildingName: "",
        limit: 4,
        maxMinute: 240,
        minMinute: 30,
        cancelMinute: 20,
        maxUser: 4,
        minUser: 3,
        openStart: "08:00",
        openEnd: "22:00",
        usage: [{
            start: "11:00",
            end: "15:00",
            state: "undo",
            title: "张*",
            occupy: true
        }]
    },
    {
        id: "2071874_2071780",
        name: "北馆3F-01",
        devId: 2071874,
        devName: "北馆3F-01",
        kindId: 2071759,
        kindName: "北馆单人研读间",
        classId: 10313,
        className: "北馆单人研读间",
        labId: 2071780,
        labName: "北馆单人间(三层)",
        roomId: 2071873,
        roomName: "北馆3F-01",
        buildingId: 0,
        buildingName: "",
        limit: 4,
        maxMinute: 240,
        minMinute: 30,
        cancelMinute: 20,
        maxUser: 1,
        minUser: 1,
        openStart: "08:00",
        openEnd: "22:00",
        usage: []
    },
    {
        id: "10494_10321",
        name: "文科馆F3-21",
        devId: 10494,
        devName: "文科馆F3-21",
        kindId: 10312,
        kindName: "文科馆单人间（三层）",
        classId: 10313,
        className: "文科馆单人间（三层）",
        labId: 10321,
        labName: "文科馆单人间（三层）",
        roomId: 10493,
        roomName: "文科馆F3-21",
        buildingId: 0,
        buildingName: "",
        limit: 4,
        maxMinute: 240,
        minMinute: 30,
        cancelMinute: 20,
        maxUser: 1,
        minUser: 1,
        openStart: "08:00",
        openEnd: "22:00",
        usage: [{
            start: "16:00",
            end: "18:30",
            state: "undo",
            title: "张*",
            occupy: true
        },
        {
            start: "09:50",
            end: "11:50",
            state: "undo",
            title: "张*",
            occupy: true
        }]
    },
    {
        id: "10498_10321",
        name: "文科馆F3-22",
        devId: 10498,
        devName: "文科馆F3-22",
        kindId: 10312,
        kindName: "文科馆单人间（三层）",
        classId: 10313,
        className: "文科馆单人间（三层）",
        labId: 10321,
        labName: "文科馆单人间（三层）",
        roomId: 10497,
        roomName: "文科馆F3-22",
        buildingId: 0,
        buildingName: "",
        limit: 4,
        maxMinute: 240,
        minMinute: 30,
        cancelMinute: 20,
        maxUser: 1,
        minUser: 1,
        openStart: "08:00",
        openEnd: "22:00",
        usage: [{
            start: "13:00",
            end: "17:00",
            state: "undo",
            title: "张*",
            occupy: true
        },
        {
            start: "18:10",
            end: "20:30",
            state: "undo",
            title: "张*",
            occupy: true
        },
        {
            start: "09:00",
            end: "11:50",
            state: "undo",
            title: "张*",
            occupy: true
        }]
    },
] as LibRoomRes[];

export const MOCK_LIB_SEARCH_RES = (keyword: string) => [{id: keyword, label: `张三(${keyword})`}] as LibFuzzySearchResult[];

export const MOCK_LIB_ROOM_RECORD = [
    {
        regDate: "2021-10-04 23:57",
        over: false,
        status: "预约成功",
        name: "北馆2F-03",
        category: "北馆团体间(二层)",
        owner: "张三",
        members: "张三(2019000000),李四(2019000001),王五(2019000002)",
        begin: "10-06 08:00",
        end: "10-06 09:30",
        description: "预约成功,未生效,审核通过",
        rsvId: "12925688"
    },
    {
        regDate: "2021-10-04 23:56",
        over: false,
        status: "预约成功",
        name: "北馆3F-03",
        category: "北馆单人间(三层)",
        owner: "张三",
        members: "个人预约",
        begin: "10-05 12:00",
        end: "10-05 16:00",
        description: "预约成功,未生效,审核通过",
        rsvId: "12925682"
    }
] as LibRoomBookRecord[];
