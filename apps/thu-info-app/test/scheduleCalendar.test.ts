import {StoredSchedule} from "../src/redux/scheduleData";
import {expect, jest, test} from "@jest/globals";
import {generateScheduleICS} from "../src/utils/calendar";
import {autumn, plan, time} from "./fixtures/schedules";
jest.mock("../src/redux/store", () => ({
	currState: () => ({config: {language: "zh", darkMode: false}}),
}));
jest.mock("uuid", () => ({v4: () => "calendar-test"}));
test("export excludes other terms and arbitrary time slots have distinct UIDs", () => {
	const text = generateScheduleICS(
		[
			plan([
				time("2025-09-14"),
				time("2025-09-17", "12:01", "12:10"),
				time("2025-09-17", "12:20", "12:30"),
			]),
		],
		{...autumn, semesterName: "秋季"},
	);
	expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(2);
	expect(text).not.toContain("20250914");
	const uids = text.match(/^UID:.+/gm)!;
	expect(uids).toHaveLength(2);
	expect(new Set(uids).size).toBe(2);
});


test("independent identical events retain distinct export identities", () => {
	const schedules: StoredSchedule[] = ["first", "second"].map((localId) => ({...plan(), localId}));
	const text = generateScheduleICS(schedules, {...autumn, semesterName: "秋季"});
	expect(text.match(/BEGIN:VEVENT/g)).toHaveLength(2);
	expect(new Set(text.match(/^UID:.+/gm)).size).toBe(2);
});
