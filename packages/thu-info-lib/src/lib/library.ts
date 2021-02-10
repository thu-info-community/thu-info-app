/* eslint-disable quotes */
import {retryWrapperWithMocks} from "./core";
import {
    CANCEL_BOOKING_URL,
    LIBRARY_AREAS_URL,
    LIBRARY_BOOK_RECORD_URL,
    LIBRARY_BOOK_URL_PREFIX,
    LIBRARY_BOOK_URL_SUFFIX,
    LIBRARY_DAYS_URL,
    LIBRARY_HOME_URL,
    LIBRARY_LIST_URL,
    LIBRARY_SEATS_URL,
} from "../constants/strings";
import {
    byId,
    LibBookRecord,
    Library,
    LibraryDate,
    LibraryFloor,
    LibrarySeat,
    LibrarySection,
    weightedValidityAndId,
} from "../models/home/library";
import cheerio from "cheerio";
import {getCheerioText} from "../utils/cheerio";
import dayjs from "dayjs";
import {InfoHelper} from "../index";
import {uFetch, stringify} from "../utils/network";
import {
    MOCK_LIBRARY_ACCESS_TOKEN,
    MOCK_LIBRARY_BOOK_SEAT_RESPONSE,
    MOCK_LIBRARY_BOOKING_RECORDS,
    MOCK_LIBRARY_FLOOR_LIST,
    MOCK_LIBRARY_LIST,
} from "../mocks/library";

type Cheerio = ReturnType<typeof cheerio>;
type Element = Cheerio[number];
type TagElement = Element & {type: "tag"};

const fetchJson = (
    url: string,
    referer?: string,
    post?: object | string,
): Promise<any> =>
    uFetch(url, referer, post).then((s) => JSON.parse(s).data.list);

export const getLibraryList = (helper: InfoHelper): Promise<Library[]> =>
    retryWrapperWithMocks(
        helper,
        undefined,
        fetchJson(LIBRARY_LIST_URL, LIBRARY_HOME_URL).then(
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
    fetchJson(
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
    );

export const getLibraryFloorList = async (
    helper: InfoHelper,
    {id, zhName, enName}: Library,
    dateChoice: 0 | 1,
): Promise<LibraryFloor[]> =>
    retryWrapperWithMocks(
        helper,
        undefined,
        fetchJson(LIBRARY_AREAS_URL + id, LIBRARY_HOME_URL)
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

const currentTime = () => {
    const date = new Date();
    return `${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}`;
};

export const getLibrarySeatList = (
    {id, zhNameTrace, enNameTrace}: LibrarySection,
    dateChoice: 0 | 1,
): Promise<LibrarySeat[]> =>
    getLibraryDay(id, dateChoice).then(
        ({day, startTime, endTime, segmentId, today}) =>
            fetchJson(LIBRARY_SEATS_URL + "?" + stringify({area: id, segment: segmentId, day, startTime: today ? currentTime() : startTime, endTime}))
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
    );

const getAccessToken = (helper: InfoHelper): Promise<string> =>
    retryWrapperWithMocks(
        helper,
        5000,
        uFetch(LIBRARY_HOME_URL).then((response) => {
            if (helper.mocked()) {
                return "";
            }
            const leftmost = response.indexOf("access_token");
            const left = response.indexOf('"', leftmost) + 1;
            const right = response.indexOf('"', left);
            const token = response.substring(left, right);
            if (token.trim() === "") {
                throw new Error("Getting library token failed.");
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
    retryWrapperWithMocks(
        helper,
        undefined,
        JSON.parse(
            await getLibraryDay(section.id, dateChoice).then(async ({segmentId}) =>
                uFetch(
                    LIBRARY_BOOK_URL_PREFIX + id + LIBRARY_BOOK_URL_SUFFIX,
                    LIBRARY_HOME_URL,
                    {
                        access_token: await getAccessToken(helper),
                        userid: helper.userId,
                        segment: segmentId,
                        type,
                    },
                ),
            ),
        ),
        MOCK_LIBRARY_BOOK_SEAT_RESPONSE,
    );

export const getBookingRecords = async (
    helper: InfoHelper,
): Promise<LibBookRecord[]> =>
    retryWrapperWithMocks(
        helper,
        undefined,
        (async (): Promise<LibBookRecord[]> => {
            await getAccessToken(helper);
            const html = await uFetch(LIBRARY_BOOK_RECORD_URL, LIBRARY_HOME_URL);
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
                throw new Error("Getting lib book record failed!");
            }
            return result;
        })(),
        MOCK_LIBRARY_BOOKING_RECORDS,
    );

export const cancelBooking = async (
    helper: InfoHelper,
    id: string,
): Promise<void> =>
    retryWrapperWithMocks(
        helper,
        undefined,
        getAccessToken(helper)
            .then((token) => uFetch(CANCEL_BOOKING_URL + id, LIBRARY_BOOK_RECORD_URL, {
                _method: "delete",
                id,
                userid: helper.userId,
                access_token: token,
            }))
            .then(JSON.parse)
            .then((data: any) => {
                if (!data.status) {
                    throw data.message;
                }
            }),
        undefined,
    );
