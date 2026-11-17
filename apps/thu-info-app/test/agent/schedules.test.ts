import {createScheduleFromToolArgs} from "../../src/agent/schedules";

const convert = (extra: Record<string, unknown>) =>
	createScheduleFromToolArgs(
		{title: "Meeting", date: "2026-09-10", beginTime: "14:00", endTime: "15:00", ...extra},
		"2026-09-07",
		18,
	);
test("new schedule wrapper validates real dates and disallows ambiguous time selection", () => {
	expect(convert({})?.activeTime.base).toHaveLength(1);
	for (const invalid of [
		{date: "2026-02-30"},
		{beginTime: "24:00"},
		{endTime: "13:00"},
		{dayOfWeek: 1},
		{title: ""},
	]) {
		expect(convert(invalid)).toBeUndefined();
	}
});
test("recurring schedule expansion is bounded and preserves full timestamps", () => {
	const schedule = convert({date: undefined, dayOfWeek: 2, weeks: [1, 3]})!;
	expect(
		schedule.activeTime.base.map((slice) => slice.beginTime.format("YYYY-MM-DD HH:mm")),
	).toEqual(["2026-09-08 14:00", "2026-09-22 14:00"]);
	expect(convert({date: undefined, dayOfWeek: 2, weeks: [19]})).toBeUndefined();
});
