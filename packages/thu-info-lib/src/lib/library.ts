/* eslint-disable quotes */
import {roam, roamingWrapperWithMocks, verifyAndReLogin} from "./core";
import {
    APP_SOCKET_STATUS_URL,
    CANCEL_BOOKING_URL,
    CONTENT_TYPE_JSON,
    LIBRARY_AREAS_URL,
    LIBRARY_BOOK_RECORD_URL,
    LIBRARY_BOOK_URL_PREFIX,
    LIBRARY_BOOK_URL_SUFFIX,
    LIBRARY_CANCEL_BOOKING_URL,
    LIBRARY_DAYS_URL,
    LIBRARY_FUZZY_SEARCH_ID_URL,
    LIBRARY_HOME_URL,
    LIBRARY_LIST_URL,
    LIBRARY_ROOM_BOOKING_ACTION_URL,
    LIBRARY_ROOM_BOOKING_QUERY_AUTH_ADDRESS_URL,
    LIBRARY_ROOM_BOOKING_RECORD_URL,
    LIBRARY_ROOM_BOOKING_RESOURCE_LIST_URL,
    LIBRARY_ROOM_BOOKING_ROOM_INFO_URL,
    LIBRARY_ROOM_BOOKING_ROOT_URL,
    LIBRARY_ROOM_BOOKING_USER_INFO_URL,
    LIBRARY_ROOM_UPDATE_EMAIL_URL,
    LIBRARY_SEATS_URL,
} from "../constants/strings";
import {
    byId,
    LibBookRecord,
    LibFuzzySearchResult,
    Library,
    LibraryDate,
    LibraryFloor,
    LibrarySeat,
    LibrarySection,
    LibRoom,
    LibRoomBookRecord,
    LibRoomInfo,
    LibRoomRes,
    LibRoomUsage,
    SocketStatus,
    weightedValidityAndId,
} from "../models/home/library";
import * as cheerio from "cheerio";
import type {ElementType} from "domelementtype";
import type {Element} from "domhandler";
import {getCheerioText} from "../utils/cheerio";
import dayjs from "dayjs";
import {InfoHelper} from "../index";
import {uFetch, stringify, getRedirectUrl} from "../utils/network";
import {
    MOCK_LIB_ROOM_RECORD, MOCK_LIB_SEARCH_RES,
    MOCK_LIBRARY_ACCESS_TOKEN,
    MOCK_LIBRARY_BOOK_SEAT_RESPONSE,
    MOCK_LIBRARY_BOOKING_RECORDS,
    MOCK_LIBRARY_FLOOR_LIST,
    MOCK_LIBRARY_LIST,
} from "../mocks/library";
import {
    LibraryError,
    LoginError,
} from "../utils/error";

type TagElement = Element & {type: ElementType.Tag};

const fetchJson = (
    url: string,
    referer?: string,
    post?: object,
): Promise<any> =>
    uFetch(url, post).then((s) => JSON.parse(s).data.list);

export const getLibraryList = (helper: InfoHelper): Promise<Library[]> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "ef84f6d6784f6b834e5214f432d6173f",
        () => fetchJson(LIBRARY_LIST_URL, LIBRARY_HOME_URL).then(
            (r) =>
                r.map((node: any) => ({
                    id: node.id,
                    zhName: node.name,
                    zhNameTrace: node.nameMerge,
                    enName: node.enname,
                    enNameTrace: node.ennameMerge,
                    valid: node.isValid === 1,
                })),
        ),
        MOCK_LIBRARY_LIST,
    );

export const getLibrarySectionList = (
    helper: InfoHelper,
    {id, zhNameTrace, enNameTrace}: LibraryFloor,
    dateChoice: 0 | 1,
): Promise<LibrarySection[]> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "ef84f6d6784f6b834e5214f432d6173f",
        () => fetchJson(
            LIBRARY_AREAS_URL +
            id +
            "/date/" +
            dayjs().add(dateChoice, "day").format("YYYY-MM-DD"),
        ).then((r) =>
            r.childArea
                .map((node: any) => ({
                    id: node.id,
                    zhName: node.name,
                    zhNameTrace: `${zhNameTrace} - ${node.name}`,
                    enName: node.enname,
                    enNameTrace: `${enNameTrace} - ${node.enname}`,
                    valid: node.isValid === 1,
                    total: node.TotalCount,
                    available: node.TotalCount - node.UnavailableSpace,
                    posX: node.point_x2,
                    posY: node.point_y2,
                }))
                .sort(byId),
        ),
        [],
    );

export const getLibraryFloorList = async (
    helper: InfoHelper,
    {id, zhName, enName}: Library,
    dateChoice: 0 | 1,
): Promise<LibraryFloor[]> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "ef84f6d6784f6b834e5214f432d6173f",
        () => fetchJson(LIBRARY_AREAS_URL + id, LIBRARY_HOME_URL)
            .then(
                (r): Promise<LibraryFloor[]> => Promise.all(
                    r.childArea.map(async (node: any) => {
                        const floor = {
                            id: node.id,
                            zhName: node.name,
                            zhNameTrace: `${zhName} - ${node.name}`,
                            enName: node.enname,
                            enNameTrace: `${enName} - ${node.enname}`,
                            valid: node.isValid === 1,
                            parentId: id,
                            available: 0,
                            total: 0,
                        };
                        const [available, total] = (
                            await Promise.all(
                                await getLibrarySectionList(helper, floor, dateChoice),
                            )
                        ).reduce(
                            ([px, py], curr) =>
                                curr.valid ? [px + curr.available, py + curr.total] : [px, py],
                            [0, 0],
                        );
                        floor.available = available;
                        floor.total = total;
                        return floor;
                    }),
                ),
            )
            .then((floors) => floors.sort(byId)),
        MOCK_LIBRARY_FLOOR_LIST(id, dateChoice),
    );

const getLibraryDay = (
    sectionId: number,
    choice: 0 | 1,
): Promise<LibraryDate> =>
    fetchJson(LIBRARY_DAYS_URL + sectionId).then((r: any[]) => {
        const {day, startTime, endTime, id} = r.find(
            (it) => it.day === dayjs().add(choice, "day").format("YYYY-MM-DD"),
        );
        const transformDate = ({date}: {date: string}) => date.substring(11, 16);
        return {
            day,
            startTime: transformDate(startTime),
            endTime: transformDate(endTime),
            segmentId: id,
            today: choice === 0,
        };
    });

const pad = (ori: any, length: number) => {
    let result = String(ori);
    while (result.length < length) {
        result = "0" + result;
    }
    return result;
};

const currentTime = (coerce: string) => {
    const date = new Date();
    const result = `${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}`;
    return coerce > result ? coerce : result;
};

export const getLibrarySeatList = (
    helper: InfoHelper,
    {id, zhNameTrace, enNameTrace}: LibrarySection,
    dateChoice: 0 | 1,
): Promise<LibrarySeat[]> =>
    roamingWrapperWithMocks(helper, undefined, "ef84f6d6784f6b834e5214f432d6173f", () =>
        Promise.all([
            getLibraryDay(id, dateChoice).then(({day, startTime, endTime, segmentId, today}) =>
                fetchJson(LIBRARY_SEATS_URL + "?" + stringify({
                    area: id,
                    segment: segmentId,
                    day,
                    startTime: today ? currentTime(startTime) : startTime,
                    endTime,
                }))),
            uFetch(`${APP_SOCKET_STATUS_URL}?sectionid=${id}`).then(JSON.parse).catch(() => []),
        ])
            .then(([r, sockets]) =>
                r
                    .map((node: any) => ({
                        id: node.id,
                        zhName: node.name,
                        zhNameTrace: zhNameTrace + " - " + node.name,
                        enName: node.name,
                        enNameTrace: enNameTrace + " - " + node.name,
                        valid: node.status === 1,
                        type: node.area_type,
                        status: sockets.find((socket: any) => socket.seatId === node.id)?.status,
                    }))
                    .sort((a: LibrarySeat, b: LibrarySeat) => weightedValidityAndId(a) - weightedValidityAndId(b)),
            )
    , []);

export const toggleSocketState = async (
    helper: InfoHelper,
    seatId: number,
    target: SocketStatus,
): Promise<void> => roamingWrapperWithMocks(
    helper,
    undefined,
    "",
    () => uFetch(
        APP_SOCKET_STATUS_URL,
        JSON.stringify({
            seatId,
            isavailable: target === "available",
        }) as never as object,
        60000,
        "UTF-8",
        true,
        "application/json",
    ).then(() => {
    }),
    undefined,
);

const getAccessToken = (helper: InfoHelper): Promise<string> =>
    roamingWrapperWithMocks(
        helper,
        "id",
        "ef84f6d6784f6b834e5214f432d6173f/0?/api/id_tsinghua_callback",
        () => uFetch(LIBRARY_HOME_URL).then((response) => {
            if (helper.mocked()) {
                return "";
            }
            const leftmost = response.indexOf("access_token");
            const left = response.indexOf('"', leftmost) + 1;
            const right = response.indexOf('"', left);
            const token = response.substring(left, right);
            if (token.trim() === "") {
                throw new LibraryError("Getting library token failed.");
            }
            return token;
        }),
        MOCK_LIBRARY_ACCESS_TOKEN,
    );

export const bookLibrarySeat = async (
    helper: InfoHelper,
    {id, type}: LibrarySeat,
    section: LibrarySection,
    dateChoice: 0 | 1,
): Promise<{status: number; msg: string}> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "ef84f6d6784f6b834e5214f432d6173f",
        async () => JSON.parse(
            await getLibraryDay(section.id, dateChoice).then(async ({segmentId}) =>
                uFetch(LIBRARY_BOOK_URL_PREFIX + id + LIBRARY_BOOK_URL_SUFFIX, {
                    access_token: await getAccessToken(helper),
                    userid: helper.userId,
                    segment: segmentId,
                    type,
                }),
            ),
        ),
        MOCK_LIBRARY_BOOK_SEAT_RESPONSE,
    );

export const getBookingRecords = async (
    helper: InfoHelper,
): Promise<LibBookRecord[]> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "ef84f6d6784f6b834e5214f432d6173f",
        async (): Promise<LibBookRecord[]> => {
            await getAccessToken(helper);
            const html = await uFetch(LIBRARY_BOOK_RECORD_URL);
            const result = cheerio.load(html)("tbody")
                .children()
                .map((index, element) => {
                    const delOnclick = (((element as TagElement).children[15] as TagElement)
                        .children[3] as TagElement | undefined)?.attribs?.onclick;
                    const delStrIndex = delOnclick ? delOnclick.indexOf("menuDel") + 9 : 0;
                    const rightIndex = delOnclick?.indexOf("'", delStrIndex);
                    return {
                        id: getCheerioText(element, 3),
                        pos: getCheerioText(element, 5),
                        time: getCheerioText(element, 7),
                        status: getCheerioText(element, 11),
                        delId: delOnclick?.includes("menuDel")
                            ? delOnclick?.substring(delStrIndex, rightIndex)
                            : undefined,
                    };
                })
                .get();
            if (result.length === 0 && html.indexOf("tbody") === -1) {
                throw new LibraryError();
            }
            return result;
        },
        MOCK_LIBRARY_BOOKING_RECORDS,
    );

export const cancelBooking = async (
    helper: InfoHelper,
    id: string,
): Promise<void> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "ef84f6d6784f6b834e5214f432d6173f",
        () => getAccessToken(helper)
            .then((token) => uFetch(CANCEL_BOOKING_URL + id, {
                _method: "delete",
                id,
                userid: helper.userId,
                access_token: token,
            }))
            .then(JSON.parse)
            .then((data: any) => {
                if (!data.status) {
                    throw new LibraryError(data.message ?? data.msg);
                }
            }),
        undefined,
    );

const accountBaseInfo = {
    accNo: -1,
};

export const getAccNo = () => accountBaseInfo.accNo;

const cabFetch = async (
    url: string,
    jsonStruct?: any,
): Promise<any> => {
    let result: any;
    try {
        if (jsonStruct === undefined) {
            result = JSON.parse(await uFetch(url));
        } else {
            result = JSON.parse(await uFetch(url, JSON.stringify(jsonStruct) as any, undefined, undefined, true, CONTENT_TYPE_JSON));
        }
    } catch (e) {
        throw new Error("Failed to parse cabFetch result");
    }
    if (result.code !== 0) {
        throw new Error(result.message);
    }
    return result.data;
};

const assureLoginValid = async (helper: InfoHelper) => {
    if (helper.userId === "") {
        const e = new LoginError("Please login.");
        helper.loginErrorHook && helper.loginErrorHook(e);
        throw e;
    }
    try {
        if (accountBaseInfo.accNo === -1 || (await cabFetch(LIBRARY_ROOM_BOOKING_USER_INFO_URL)).pid !== helper.userId) {
            await cabLogin(helper);
        }
    }
    catch {
        try {
            await cabLogin(helper);
        } catch (e) {
            if (await verifyAndReLogin(helper)) {
                await cabLogin(helper);
            } else {
                throw e;
            }
        }
    }
};

export const cabLogin = async (helper: InfoHelper): Promise<void> => {
    if (helper.mocked()) {
        return;
    }
    const authAddress: string = await cabFetch(LIBRARY_ROOM_BOOKING_QUERY_AUTH_ADDRESS_URL);
    const loginUrl = await getRedirectUrl(authAddress.replace("http://cab.lib.tsinghua.edu.cn", LIBRARY_ROOM_BOOKING_ROOT_URL));
    const payload = /\/login\/form\/(.+)$/.exec(loginUrl)?.[1];
    if (payload === undefined) {
        throw new Error("Failed to get payload in cabLogin. Retry later.");
    }
    await roam(helper, "cab", payload);
    const {pid, accNo} = await cabFetch(LIBRARY_ROOM_BOOKING_USER_INFO_URL);
    if (pid !== helper.userId) {
        throw new Error("Failed to get pid in cabLogin. Retry later.");
    }
    accountBaseInfo.accNo = accNo;
};

export const getLibraryRoomBookingInfoList = async (helper: InfoHelper): Promise<LibRoomInfo[]> => {
    if (helper.mocked()) {
        return [];
    }
    await assureLoginValid(helper);
    const data = await cabFetch(LIBRARY_ROOM_BOOKING_ROOM_INFO_URL);
    return data.map((item: any) => ({
        kindId: item.kindId,
        kindName: item.kindName,
        rooms: item.roomInfos.map((info: any) => ({
            devId: info.devId,
            devName: info.devName,
            minReserveTime: info.minResvTime,
        } as LibRoom)),
    }) as LibRoomInfo);
};

export const getLibraryRoomBookingResourceList = async (
    helper: InfoHelper,
    date: string, // yyyyMMdd
    kindId: number,
): Promise<LibRoomRes[]> => {
    if (helper.mocked()) {
        return [];
    }
    await assureLoginValid(helper);
    const data = await cabFetch(`${LIBRARY_ROOM_BOOKING_RESOURCE_LIST_URL}&resvDates=${date}&kindIds=${kindId}`);
    return data.map((item: any) => ({
        devId: item.devId,
        devName: item.devName,
        kindId: item.kindId,
        kindName: item.kindName,
        labId: item.labId,
        labName: item.labName,
        roomId: item.roomId,
        roomName: item.roomName,
        limit: item.resvRule.limit,
        maxMinute: item.resvRule.maxResvTime,
        minMinute: item.resvRule.minResvTime,
        cancelMinute: item.resvRule.cancelTime,
        maxUser: item.maxUser,
        minUser: item.minUser,
        openStart: item.openStart,
        openEnd: item.openEnd,
        usage: item.resvInfo.map((info: any) => ({
            id: info.resvId,
            start: new Date(info.startTime),
            end: new Date(info.endTime),
            title: info.title,
            owner: info.trueName,
            ownerId: info.logonName,
        } as LibRoomUsage)),
    } as LibRoomRes));
};

export const fuzzySearchLibraryId = async (helper: InfoHelper, keyword: string): Promise<LibFuzzySearchResult[]> => {
    if (helper.mocked()) {
        return MOCK_LIB_SEARCH_RES(keyword);
    }
    await assureLoginValid(helper);
    const data = await cabFetch(LIBRARY_FUZZY_SEARCH_ID_URL + encodeURIComponent(keyword));
    return data.map((r: any) => ({
        id: r.accNo,
        label: r.logonName,
        department: r.deptName,
    } as LibFuzzySearchResult));
};

export const bookLibraryRoom = async (
    helper: InfoHelper,
    roomRes: LibRoomRes,
    start: string,  // yyyy-MM-dd HH:mm
    end: string,  // yyyy-MM-dd HH:mm
    memberList: number[],  // student id's
): Promise<void> => {
    if (helper.mocked()) {
        return;
    }
    await assureLoginValid(helper);
    await cabFetch(LIBRARY_ROOM_BOOKING_ACTION_URL, {
        sysKind: 1,
        appAccNo: accountBaseInfo.accNo,
        memberKind: 1,
        resvBeginTime: start,
        resvEndTime: end,
        testName: "",
        resvKind: 2,
        resvProperty: 0,
        appUrl: "",
        resvMember: memberList,
        resvDev: [roomRes.devId],
        memo: "",
        captcha: "",
        addServices: [],
    });
};

export const getLibraryRoomBookingRecord = async (
    helper: InfoHelper
): Promise<LibRoomBookRecord[]> => {
    if (helper.mocked()) {
        return MOCK_LIB_ROOM_RECORD;
    }
    await assureLoginValid(helper);
    const begin = dayjs();
    const end = begin.add(6, "day");
    const data = await cabFetch(`${LIBRARY_ROOM_BOOKING_RECORD_URL}&beginDate=${begin.format("YYYY-MM-DD")}&endDate=${end.format("YYYY-MM-DD")}`);
    return data.map((item: any) => ({
        uuid: item.uuid,
        rsvId: item.resvId,
        owner: item.resvName,
        ownerId: item.logonName,
        date: String(item.resvDate),
        begin: new Date(item.resvBeginTime),
        end: new Date(item.resvEndTime),
        devName: item.resvDevInfoList[0].devName,
        kindName: item.resvDevInfoList[0].kindName,
        members: item.resvMemberInfoList.map((member: any) => ({name: member.trueName, userId: member.logonName})),
    } as LibRoomBookRecord));
};

export const cancelLibraryRoomBooking = async (
    helper: InfoHelper,
    uuid: string,
): Promise<void> => {
    if (helper.mocked()) {
        return;
    }
    await assureLoginValid(helper);
    await cabFetch(LIBRARY_CANCEL_BOOKING_URL, {uuid});
};

export const updateLibraryRoomEmail = async (
    helper: InfoHelper,
    email: string,
): Promise<void> => {
    if (helper.mocked()) {
        return;
    }
    await assureLoginValid(helper);
    await cabFetch(LIBRARY_ROOM_UPDATE_EMAIL_URL, {email});
};
