import {expect, jest, test} from "@jest/globals";
import type {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {searchCrCourses} from "./cr";

jest.mock("./core", () => ({roamingWrapperWithMocks: (_helper: unknown, _policy: unknown, _payload: unknown, operation: () => Promise<unknown>) => operation()}));
jest.mock("../utils/network", () => ({uFetch: jest.fn()}));

const helper = {graduate: () => false} as InfoHelper;
const row = (cells: Array<string | number>) => `<tr class="trr2">${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
const table = (rows: string[]) => `<table>${rows.join("")}</table>`;

test("matches course capacity by course ID and sequence", async () => {
    const remaining = table([
        row(["12345678", 1, "Test Course", 30, 5, 2, "Teacher A", "1-1"]),
        row(["12345678", 2, "Test Course", 60, 12, 4, "Teacher B", "2-2"]),
    ]);
    const primaryOpen = table([
        row(["Department", "12345678", 1, "Test Course", 2, "Teacher A", 30, 0, 30, 0, "1-1", "", "", "", "", "", "No", "", "No"]),
        row(["Department", "12345678", 2, "Test Course", 2, "Teacher B", 60, 0, 60, 0, "2-2", "", "", "", "", "", "No", "", "No"]),
    ]);
    jest.mocked(uFetch).mockResolvedValueOnce(remaining).mockResolvedValueOnce(primaryOpen);

    const result = await searchCrCourses(helper, {semester: "2026-2027-1"});

    expect(result.courses.map(({seq, capacity, remaining: available, queue}) => ({seq, capacity, available, queue}))).toEqual([
        {seq: 1, capacity: 30, available: 5, queue: 2},
        {seq: 2, capacity: 60, available: 12, queue: 4},
    ]);
});
