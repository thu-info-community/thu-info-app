import {beforeEach, expect, jest, test} from "@jest/globals";
import type {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {searchCrCourses, searchCrRemaining} from "./cr";
import {CR_SEARCH_URL, CR_SEARCH_YJS_URL} from "../constants/strings";
import {MOCK_CR_PRIMARY_OPEN_SEARCH_RESULT, MOCK_CR_REMAINING_SEARCH_RESULT, MOCK_CR_SEARCH_RESULT} from "../mocks/cr";

jest.mock("./core", () => ({roamingWrapperWithMocks: (_helper: unknown, _policy: unknown, _payload: unknown, operation: () => Promise<unknown>) => operation()}));
jest.mock("../utils/network", () => ({uFetch: jest.fn()}));

const helper = (graduate = false) => ({graduate: () => graduate} as InfoHelper);
const row = (cells: Array<string | number>) => `<tr class="trr2">${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
const table = (rows: string[], page = 1, totalPage = 1, totalCount = rows.length) =>
    `<table>${rows.join("")}</table><p class="yeM">${"<span></span>".repeat(5)}第 ${page} 页 / 共 ${totalPage} 页（共 ${totalCount} 条记录）</p>`;
const course = (
    id: string,
    seq: number,
    bksCap: string | number,
    bksSelected: string | number,
    yjsCap: string | number,
    yjsSelected: string | number,
) => row(["Department", id, seq, "Test Course", 2, "Teacher", bksCap, bksSelected, yjsCap, yjsSelected, "1-1", "", "", "", "", "", "No", "", "No"]);
const mockTables = (primaryOpen: string | Error, remaining: string | Error = table([])) => {
    jest.mocked(uFetch).mockImplementation(async (_url, post) => {
        const method = (post as {m: string}).m;
        if (method !== "kkxxSearch" && method !== "kylSearch") {
            throw new Error(`Unexpected search method: ${method}`);
        }
        const response = method === "kkxxSearch" ? primaryOpen : remaining;
        if (response instanceof Error) {
            throw response;
        }
        return response;
    });
};

beforeEach(() => {
    jest.mocked(uFetch).mockReset();
});

test("keeps remaining and queue unknown for courses absent from the remaining table", async () => {
    mockTables(table([
        course("00000042", 90, 30, 5, 0, 0),
        course("00000171", 90, 26, 4, 2, 1),
    ]));

    const result = await searchCrCourses(helper(), {semester: "2026-2027-1"});

    expect(result.courses.map(({id, capacity, remaining, queue}) => ({id, capacity, remaining, queue}))).toEqual([
        {id: "00000042", capacity: 30, remaining: NaN, queue: NaN},
        {id: "00000171", capacity: 26, remaining: NaN, queue: NaN},
    ]);
    expect(jest.mocked(uFetch)).toHaveBeenCalledTimes(2);
});

test("finishes the open-course query before requesting remaining data", async () => {
    let resolveOpen!: (html: string) => void;
    const open = new Promise<string>((resolve) => { resolveOpen = resolve; });
    jest.mocked(uFetch).mockImplementation(async (_url, post) => {
        if ((post as {m: string}).m === "kkxxSearch") return open;
        return table([row(["00000042", 90, "Test Course", 30, 25, 2, "Teacher", "1-1"])]);
    });

    const search = searchCrCourses(helper(), {semester: "2026-2027-1"});

    expect(jest.mocked(uFetch)).toHaveBeenCalledTimes(1);
    resolveOpen(table([course("00000042", 90, 30, 5, 0, 0)]));
    const result = await search;
    expect(jest.mocked(uFetch).mock.calls.map(([, post]) => (post as {m: string}).m)).toEqual(["kkxxSearch", "kylSearch"]);
    expect(result.courses[0]).toMatchObject({capacity: 30, remaining: 25, queue: 2});
});

test("preserves authoritative capacity, remaining and queue by course ID and sequence", async () => {
    mockTables(table([
        course("12345678", 1, 30, 0, 30, 0),
        course("12345678", 2, 60, 0, 60, 0),
        course("87654321", 1, 20, 3, 0, 0),
    ], 2, 3, 43), table([
        row(["12345678", 2, "Test Course", 60, 12, 4, "Teacher", "1-1"]),
        row(["12345678", 1, "Test Course", 30, 5, 2, "Teacher", "1-1"]),
    ], 1, 1, 2));

    const result = await searchCrCourses(helper(), {semester: "2026-2027-1", page: 2});

    expect(result).toMatchObject({currPage: 2, totalPage: 3, totalCount: 43});
    expect(result.courses.map(({id, seq, capacity, remaining, queue}) => ({id, seq, capacity, remaining, queue}))).toEqual([
        {id: "12345678", seq: 1, capacity: 30, remaining: 5, queue: 2},
        {id: "12345678", seq: 2, capacity: 60, remaining: 12, queue: 4},
        {id: "87654321", seq: 1, capacity: 20, remaining: NaN, queue: NaN},
    ]);
});

test.each([
    {graduate: false, bksCap: 30, bksSelected: 30, capacity: 30},
    {graduate: true, bksCap: 30, bksSelected: 30, capacity: 2},
    {graduate: false, bksCap: 0, bksSelected: 0, capacity: 0},
])("uses the current account's capacity when graduate=$graduate and bksCap=$bksCap", async ({graduate, bksCap, bksSelected, capacity}) => {
    mockTables(table([course("00000171", 90, bksCap, bksSelected, 2, 1)]));

    const params = {semester: "2026-2027-1", page: 2, id: "00000171", name: "Test Course", dayOfWeek: 1, period: 2};
    const result = await searchCrCourses(helper(graduate), params);

    expect(result.courses[0]).toMatchObject({capacity, remaining: NaN, queue: NaN});
    expect(jest.mocked(uFetch)).toHaveBeenCalledWith(
        graduate ? CR_SEARCH_YJS_URL : CR_SEARCH_URL,
        expect.objectContaining({m: "kkxxSearch", page: 2, p_xnxq: params.semester, p_kch: params.id, p_kcm: params.name, p_skxq: 1, p_skjc: 2}),
        60000,
        "GBK",
    );
});

test("propagates a remaining query failure for session recovery", async () => {
    const error = new Error("Remaining query unavailable");
    mockTables(table([course("00000042", 90, 30, 5, 0, 0)]), error);

    await expect(searchCrCourses(helper(), {semester: "2026-2027-1"})).rejects.toBe(error);
});

test("uses the remaining query's 1/35 instead of the open-course count", async () => {
    mockTables(table([course("12345678", 1, 35, 1, 0, 0)]), table([
        row(["12345678", 1, "Test Course", 35, 1, 0, "Teacher", "1-1"]),
    ]));

    const result = await searchCrCourses(helper(), {semester: "2026-2027-1", id: "12345678"});

    expect(result.courses[0]).toMatchObject({capacity: 35, remaining: 1});
});

test("propagates an open-course query failure", async () => {
    const error = new Error("Open-course query unavailable");
    mockTables(error);

    await expect(searchCrCourses(helper(), {semester: "2026-2027-1"})).rejects.toBe(error);
});

test.each(["", "--"])("does not infer remaining seats from selected count '%s'", async (selected) => {
    mockTables(table([course("00000042", 90, 30, selected, 0, 0)]));

    const result = await searchCrCourses(helper(), {semester: "2026-2027-1"});

    expect(result.courses[0].capacity).toBe(30);
    expect(result.courses[0].remaining).toBeNaN();
});

test("keeps blank capacity unknown even when the other quota is available", async () => {
    mockTables(table([course("00000042", 90, "", 0, 30, 0)]));

    const result = await searchCrCourses(helper(), {semester: "2026-2027-1"});

    expect(result.courses[0].capacity).toBeNaN();
    expect(result.courses[0].remaining).toBeNaN();
});

test("keeps absent queue columns and blank remaining fields unknown", async () => {
    jest.mocked(uFetch).mockResolvedValueOnce(table([
        row(["00000042", 90, "Test Course", 30, 25, "Teacher", "1-1"]),
        row(["00000171", 90, "Test Course", "", "", "", "Teacher", "1-1"]),
    ]));

    const result = await searchCrRemaining(helper(), {semester: "2026-2027-1"});

    expect(result.courses[0]).toMatchObject({capacity: 30, remaining: 25, queue: NaN, teacher: "Teacher", time: "1-1"});
    expect(result.courses[1]).toMatchObject({capacity: NaN, remaining: NaN, queue: NaN});
});

test("returns an empty open-course page without adding remaining-only courses", async () => {
    mockTables(table([]), table([row(["00000042", 90, "Test Course", 30, 25, 2, "Teacher", "1-1"])]));

    const result = await searchCrCourses(helper(), {semester: "2026-2027-1"});

    expect(result).toMatchObject({currPage: 1, totalPage: 1, totalCount: 0, courses: []});
});

test("mock search results agree with undergraduate quotas and remaining records", () => {
    for (const entry of MOCK_CR_SEARCH_RESULT.courses) {
        const primaryOpen = MOCK_CR_PRIMARY_OPEN_SEARCH_RESULT.courses.find((r) => r.id === entry.id && r.seq === entry.seq)!;
        const remaining = MOCK_CR_REMAINING_SEARCH_RESULT.courses.find((r) => r.id === entry.id && r.seq === entry.seq)!;
        expect(entry).toMatchObject(primaryOpen);
        expect(entry.capacity).toBe(primaryOpen.bksCap);
        expect({capacity: entry.capacity, remaining: entry.remaining, queue: entry.queue}).toEqual({
            capacity: remaining.capacity,
            remaining: remaining.remaining,
            queue: remaining.queue,
        });
    }
});
