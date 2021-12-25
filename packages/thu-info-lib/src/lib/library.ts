/* eslint-disable quotes */
import {roamingWrapperWithMocks} from "./core";
import {
    CANCEL_BOOKING_URL,
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
    LIBRARY_ROOM_BOOKING_RECORD_URL,
    LIBRARY_ROOM_BOOKING_RESOURCE_LIST_URL_PREFIX,
    LIBRARY_ROOM_BOOKING_RESOURCE_LIST_URL_SUFFIX,
    LIBRARY_SEATS_URL,
} from "../constants/strings";
import {
    byId,
    LibBookRecord,
    LibFuzzySearchResult,
    LibName,
    Library,
    LibraryDate,
    LibraryFloor,
    LibrarySeat,
    LibrarySection,
    LibRoomBookRecord,
    LibRoomRes,
    LibRoomUsage,
    weightedValidityAndId,
} from "../models/home/library";
import cheerio from "cheerio";
import {getCheerioText} from "../utils/cheerio";
import dayjs from "dayjs";
import {InfoHelper} from "../index";
import {uFetch, stringify} from "../utils/network";
import {
    MOCK_LIB_ROOM_RECORD,
    MOCK_LIB_ROOM_RES_LIST, MOCK_LIB_SEARCH_RES,
    MOCK_LIBRARY_ACCESS_TOKEN,
    MOCK_LIBRARY_BOOK_SEAT_RESPONSE,
    MOCK_LIBRARY_BOOKING_RECORDS,
    MOCK_LIBRARY_FLOOR_LIST,
    MOCK_LIBRARY_LIST,
} from "../mocks/library";
import {CabError, LibraryError} from "../utils/error";

type Cheerio = ReturnType<typeof cheerio>;
type Element = Cheerio[number];
type TagElement = Element & {type: "tag"};

const fetchJson = (
    url: string,
    referer?: string,
    post?: object,
): Promise<any> =>
    uFetch(url, post).then((s) => JSON.parse(s).data.list);

// This function needs to be updated periodically to avoid bugs
const getLibName = (name: string, kindName: string): LibName => {
    if (name.indexOf("北馆") !== -1 || kindName.indexOf("北馆") !== -1) {
        return "NORTH";
    } else if (name.indexOf("西馆") !== -1 || kindName.indexOf("西馆") !== -1) {
        return "WEST";
    } else if (name.indexOf("文科馆") !== -1 || kindName.indexOf("文科馆") !== -1) {
        return "SOCIAL";
    } else {
        return "LAW";
    }
};

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
        getLibraryDay(id, dateChoice).then(
            ({day, startTime, endTime, segmentId, today}) =>
                fetchJson(LIBRARY_SEATS_URL + "?" + stringify({
                    area: id,
                    segment: segmentId,
                    day,
                    startTime: today ? currentTime(startTime) : startTime,
                    endTime,
                }))
                    .then((r) =>
                        r
                            .map((node: any) => ({
                                id: node.id,
                                zhName: node.name,
                                zhNameTrace: zhNameTrace + " - " + node.name,
                                enName: node.name,
                                enNameTrace: enNameTrace + " - " + node.name,
                                valid: node.status === 1,
                                type: node.area_type,
                            }))
                            .sort(
                                (a: LibrarySeat, b: LibrarySeat) =>
                                    weightedValidityAndId(a) - weightedValidityAndId(b),
                            ),
                    ),
        ), []);

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
            const result = cheerio("tbody", html)
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

export const getLibraryRoomBookingResourceList = async (
    helper: InfoHelper,
    date: string, // yyyyMMdd
): Promise<LibRoomRes[]> =>
    roamingWrapperWithMocks(
        helper,
        "cab",
        "",
        async (): Promise<LibRoomRes[]> => {
            const result = await uFetch(`${LIBRARY_ROOM_BOOKING_RESOURCE_LIST_URL_PREFIX}${date}${LIBRARY_ROOM_BOOKING_RESOURCE_LIST_URL_SUFFIX}`).then(JSON.parse);
            return result.data.map((item: any) => ({
                id: item.id,
                name: item.name,
                loc: getLibName(item.name, item.kindName),
                devId: Number(item.devId),
                devName: item.devName,
                kindId: Number(item.kindId),
                kindName: item.kindName,
                classId: Number(item.classId),
                className: item.className,
                labId: Number(item.labId),
                labName: item.labName,
                roomId: Number(item.roomId),
                roomName: item.roomName,
                buildingId: Number(item.buildingId),
                buildingName: item.buildingName,
                limit: item.limit,
                maxMinute: item.max,
                minMinute: item.min,
                cancelMinute: item.cancel,
                maxUser: item.maxUser,
                minUser: item.minUser,
                openStart: item.openStart,
                openEnd: item.openEnd,
                usage: item.ts.map((ts: any) => ({
                    start: ts.start.substring(11),
                    end: ts.end.substring(11),
                    state: ts.state,
                    title: ts.title,
                    occupy: ts.occupy,
                } as LibRoomUsage)),
            } as LibRoomRes));
        },
        MOCK_LIB_ROOM_RES_LIST,
    );

export const fuzzySearchLibraryId = async (helper: InfoHelper, keyword: string): Promise<LibFuzzySearchResult[]> =>
    roamingWrapperWithMocks(
        helper,
        "cab",
        "",
        async (): Promise<LibFuzzySearchResult[]> => uFetch(LIBRARY_FUZZY_SEARCH_ID_URL + encodeURIComponent(keyword)).then(JSON.parse),
        MOCK_LIB_SEARCH_RES(keyword),
    );

export const bookLibraryRoom = async (
    helper: InfoHelper,
    roomRes: LibRoomRes,
    start: string,  // yyyy-MM-dd HH:mm
    end: string,  // yyyy-MM-dd HH:mm
    memberList: string[],  // student id's
): Promise<{success: boolean, msg: string}> =>
    roamingWrapperWithMocks(
        helper,
        "cab",
        "",
        async (): Promise<{success: boolean, msg: string}> => {
            const middle = memberList.length === 0 ? "" : `&min_user=${roomRes.minUser}&max_user=${roomRes.maxUser}&mb_list=$${memberList.join(',')}`;
            const result = await uFetch(`${LIBRARY_ROOM_BOOKING_ACTION_URL}?dialogid=&dev_id=${roomRes.devId}&lab_id=${roomRes.labId}&kind_id=${roomRes.kindId}&room_id=${roomRes.roomId}&type=dev&prop=&test_id=&term=&Vnumber=&classkind=&test_name=${middle}&start=${start}&end=${end}&start_time=${start.substring(11, 13)}${start.substring(14, 16)}&end_time=${end.substring(11, 13)}${end.substring(14, 16)}&up_file=&memo=&act=set_resv`).then(JSON.parse);
            if (result.ret === -1) {
                throw new CabError(result.msg);
            }
            return {success: result.ret === 1, msg: result.msg};
        },
        {success: true, msg: "操作成功！"}
    );

export const getLibraryRoomBookingRecord = async (
    helper: InfoHelper
): Promise<LibRoomBookRecord[]> =>
    roamingWrapperWithMocks(
        helper,
        "cab",
        "",
        async() :Promise<LibRoomBookRecord[]> => {
            const result = await uFetch(LIBRARY_ROOM_BOOKING_RECORD_URL).then(s => JSON.parse(s).msg);
            if (result.includes("没有数据")) return [];
            const tables = cheerio("tbody", result);
            return tables.map((_, table) => {
                const tableElement = cheerio(table);
                const tableAttr = tableElement.attr();
                const tableRow = cheerio(tableElement.find("tr").get()[1]).children("td");
                const textPrimary = cheerio(tableRow[3]).find(".text-primary").get();
                return {
                    regDate: tableAttr.date,
                    over: tableAttr.over === "true",
                    status: ((tableElement.find(".orange")[0] ?? tableElement.find(".green")[0]) as TagElement).children[0].data,
                    name: cheerio(tableRow[0]).find(".box > a").text(),
                    category: cheerio(tableRow[0]).find(".grey").text(),
                    owner: (tableRow[1] as TagElement).children[0].data,
                    members: cheerio(tableRow[2]).text(),
                    begin: cheerio(textPrimary[0]).text(),
                    end: cheerio(textPrimary[1]).text(),
                    description: cheerio(tableRow[4]).text(),
                    rsvId: cheerio(tableRow[5]).find("[rsvId]").attr()?.rsvid,
                } as LibRoomBookRecord;
            }).get();
        },
        MOCK_LIB_ROOM_RECORD,
    );

export const cancelLibraryRoomBooking = async (
    helper: InfoHelper,
    id: string,
): Promise<{success: boolean, msg: string}> =>
    roamingWrapperWithMocks(
        helper,
        "cab",
        "",
        async () : Promise<{success: boolean, msg: string}> => {
            const result = await uFetch(LIBRARY_CANCEL_BOOKING_URL + id).then(JSON.parse);
            if (result.ret === -1) {
                throw new CabError(result.msg);
            }
            return {success: result.ret === 1, msg: result.msg};
        },
        {success: true, msg: "操作成功！"},
    );
