import dayjs from "dayjs";
import {
	getImportRange,
	IMPORT_LIMITS,
	parseScheduleICS,
} from "../src/utils/scheduleImport";
import {
	classifyImportRecords,
	scheduleRecords,
} from "../src/utils/scheduleImportData";
import {
	scheduleReducer,
	scheduleFetch,
	scheduleImportCustomBatch,
	scheduleClearImportOverrides,
	scheduleAddCustom,
	scheduleClear,
} from "../src/redux/slices/schedule";
import {
	Schedule,
	ScheduleType,
} from "@thu-info/lib/src/models/schedule/schedule";
import {
	serializeSchedule,
	deserializeSchedule,
	migrateScheduleState,
} from "../src/utils/schedulePersistence";
import {generateScheduleICS} from "../src/utils/calendar";

jest.mock("../src/utils/i18n", () => ({
	getStr: (key: string) =>
		require("../src/assets/translations/en").default[key],
}));

const options = {startDate: "2026-07-01", endDate: "2026-07-31"};
const calendar = (...events: string[]) =>
	[
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Test//EN",
		...events,
		"END:VCALENDAR",
	].join("\r\n");
const event = (
	extra = "",
	name = "Summer course",
	start = "20260704T091500",
	end = "20260704T101000",
) =>
	[
		"BEGIN:VEVENT",
		"UID:shared-old-export-id",
		`SUMMARY:${name}`,
		"LOCATION:Room 1",
		`DTSTART:${start}`,
		`DTEND:${end}`,
		extra,
		"END:VEVENT",
	]
		.filter(Boolean)
		.join("\r\n");
const source = (
	name: string,
	date: string,
	type = ScheduleType.PRIMARY,
): Schedule => ({
	name,
	location: "Room 1",
	hash: `${name}@Room1`,
	type,
	delOrHideTime: {base: []},
	activeTime: {
		base: [
			{
				dayOfWeek: dayjs(date).day() || 7,
				beginTime: dayjs(`${date}T09:15:00`),
				endTime: dayjs(`${date}T10:10:00`),
			},
		],
	},
});

describe("ICS parsing", () => {
	it("preserves precise weekend times, Unicode, folding and escaped text", async () => {
		const result = await parseScheduleICS(
			calendar(event("", "阅读\\, 运动\r\n 与休息")),
			options,
		);
		expect(result.records).toHaveLength(1);
		expect(result.records[0].name).toBe("阅读, 运动与休息");
		expect(dayjs(result.records[0].start).format("YYYY-MM-DD HH:mm")).toBe(
			"2026-07-04 09:15",
		);
		expect(dayjs(result.records[0].end).format("HH:mm")).toBe("10:10");
		expect(result.floatingTime).toBe(true);
	});
	it("expands alternate weeks and removes EXDATE while including RDATE", async () => {
		const result = await parseScheduleICS(
			calendar(
				event(
					"RRULE:FREQ=WEEKLY;INTERVAL=2;COUNT=3\r\nEXDATE:20260718T091500\r\nRDATE:20260711T091500",
				),
			),
			options,
		);
		expect(
			result.records.map((r) => dayjs(r.start).format("YYYY-MM-DD")),
		).toEqual(["2026-07-04", "2026-07-11"]);
	});
	it("bounds infinite recurrence and honours the inclusive end date", async () => {
		const result = await parseScheduleICS(calendar(event("RRULE:FREQ=DAILY")), {
			startDate: "2026-07-04",
			endDate: "2026-07-05",
		});
		expect(result.records).toHaveLength(2);
	});
	it("imports a moved occurrence once, including moves into the selected range", async () => {
		const replacement = event(
			"RECURRENCE-ID:20260704T091500",
			"Moved",
			"20260706T110000",
			"20260706T120000",
		);
		const result = await parseScheduleICS(
			calendar(event("RRULE:FREQ=WEEKLY;COUNT=2"), replacement),
			{startDate: "2026-07-06", endDate: "2026-07-12"},
		);
		expect(result.records.map((r) => r.name)).toEqual([
			"Moved",
			"Summer course",
		]);
		expect(new Set(result.records.map((r) => r.id)).size).toBe(2);
	});
	it("respects cancelled exceptions without restoring the original occurrence", async () => {
		const cancelled = event(
			"RECURRENCE-ID:20260704T091500\r\nSTATUS:CANCELLED",
		);
		const result = await parseScheduleICS(
			calendar(event("RRULE:FREQ=WEEKLY;COUNT=2"), cancelled),
			options,
		);
		expect(result.records).toHaveLength(1);
		expect(dayjs(result.records[0].start).date()).toBe(11);
	});
	it("does not collapse independent events that share an old exported UID", async () => {
		const result = await parseScheduleICS(
			calendar(event("", "One"), event("", "Two")),
			options,
		);
		expect(result.records).toHaveLength(2);
	});
	it("normalizes type prefixes only for THUInfo exports", async () => {
		const text = calendar(event("", "[自定义] Weekend")).replace(
			"-//Test//EN",
			"-//thu-info-app//thu-info-app//EN",
		);
		expect((await parseScheduleICS(text, options)).records[0].name).toBe(
			"Weekend",
		);
		expect(
			(
				await parseScheduleICS(
					calendar(event("", "[Custom] My title")),
					options,
				)
			).records[0].name,
		).toBe("[Custom] My title");
	});
	it("round-trips the actual app exporter without changing local names or times", async () => {
		const schedules = [
			source("Reading", "2026-07-04", ScheduleType.CUSTOM),
			source("Study", "2026-07-05", ScheduleType.CUSTOM),
		];
		const text = generateScheduleICS(schedules, {
			firstDay: options.startDate,
			weekCount: 5,
			semesterId: "2026-3",
			semesterName: "Summer",
		});
		const result = await parseScheduleICS(text, options);
		expect(
			result.records.map(({name, start, end}) => ({name, start, end})),
		).toEqual(
			scheduleRecords(schedules).map(({name, start, end}) => ({
				name,
				start,
				end,
			})),
		);
	});
	it("uses UTC instants and file-provided timezone definitions", async () => {
		const zone = [
			"BEGIN:VTIMEZONE",
			"TZID:Test/UTC8",
			"BEGIN:STANDARD",
			"DTSTART:19700101T000000",
			"TZOFFSETFROM:+0800",
			"TZOFFSETTO:+0800",
			"END:STANDARD",
			"END:VTIMEZONE",
		].join("\r\n");
		const zoned = event()
			.replace("DTSTART:", "DTSTART;TZID=Test/UTC8:")
			.replace("DTEND:", "DTEND;TZID=Test/UTC8:");
		const result = await parseScheduleICS(calendar(zone, zoned), options);
		expect(result.records[0].start).toBe(Date.parse("2026-07-04T01:15:00Z"));
		const utc = await parseScheduleICS(
			calendar(event("", "UTC", "20260704T091500Z", "20260704T101000Z")),
			options,
		);
		expect(utc.records[0].start).toBe(Date.parse("2026-07-04T09:15:00Z"));
	});
	it.each([
		[event().replace(/DTSTART:/, "DTSTART;TZID=Unknown/Zone:"), "timezone"],
		[event("RRULE:FREQ=SECONDLY"), "recurrence"],
		[event("RRULE:FREQ=WEEKLY;BYMONTH=7"), "recurrence"],
		[event("", "Night", "20260704T233000", "20260705T003000"), "overnight"],
		[
			event().replace("DTSTART:20260704T091500", "DTSTART;VALUE=DATE:20260704"),
			"allDay",
		],
		[event("", "Bad", "20260704T101000", "20260704T091500"), "invalid"],
		[
			event("", "Invalid date", "20260230T091500", "20260230T101000"),
			"invalid",
		],
		[event("STATUS:CANCELLED"), "cancelled"],
		[event("", "Outside", "20260804T091500", "20260804T101000"), "outside"],
	])(
		"reports unsupported or invalid events without writing partial data",
		async (text, reason) => {
			const result = await parseScheduleICS(calendar(text), options);
			expect(result.records).toEqual([]);
			expect(result.issues[0].reason).toBe(reason);
		},
	);
	it("rejects bad files and unreasonable ranges", async () => {
		await expect(
			parseScheduleICS("not a calendar", options),
		).rejects.toMatchObject({code: "invalidFile"});
		expect(() => getImportRange("2026-02-30", "2026-03-02")).toThrow();
		expect(() => getImportRange("2026-07-31", "2026-07-01")).toThrow();
		expect(() => getImportRange("2026-01-01", "2027-01-02")).toThrow();
		expect((await parseScheduleICS(calendar(), options)).records).toEqual([]);
	});
	it("rejects over-limit files and expanded events instead of truncating", async () => {
		await expect(
			parseScheduleICS("x".repeat(IMPORT_LIMITS.bytes + 1), options),
		).rejects.toMatchObject({code: "fileTooLarge"});
		await expect(
			parseScheduleICS(calendar(...Array(1001).fill(event())), options),
		).rejects.toMatchObject({code: "limit"});
		const text = calendar(
			...Array.from({length: 15}, (_, i) =>
				event("RRULE:FREQ=DAILY", `Course ${i}`),
			),
		);
		await expect(
			parseScheduleICS(text, {startDate: "2026-07-04", endDate: "2027-07-03"}),
		).rejects.toMatchObject({code: "limit"});
	});
	it("can abort a large expansion", async () => {
		const controller = new AbortController();
		const promise = parseScheduleICS(calendar(event("RRULE:FREQ=DAILY")), {
			startDate: "2026-07-01",
			endDate: "2027-06-30",
			signal: controller.signal,
		});
		controller.abort();
		await expect(promise).rejects.toMatchObject({code: "aborted"});
	});
});

describe("append and replace date ranges", () => {
	const range = getImportRange("2026-07-04", "2026-07-05");
	const official = [
		source("Incorrect official", "2026-07-04"),
		source("Unaffected", "2026-07-11"),
	];
	const records = scheduleRecords([
		source("Actual course", "2026-07-04", ScheduleType.CUSTOM),
	]);
	const initial = () =>
		scheduleReducer(
			undefined,
			scheduleFetch({schedule: official, semesterId: "2026-3"}),
		);
	it("appends, skips exact duplicates and preserves conflicting official events", () => {
		const action = scheduleImportCustomBatch({records, mode: "append", range});
		const state = scheduleReducer(initial(), action);
		expect(scheduleRecords(state.baseSchedule)).toHaveLength(3);
		expect(
			scheduleRecords(scheduleReducer(state, action).baseSchedule),
		).toHaveLength(3);
		expect(
			classifyImportRecords(records, scheduleRecords(official))[0].status,
		).toBe("conflict");
	});
	it("replaces all events in the window, but retains other dates and refresh suppression", () => {
		let state = scheduleReducer(
			initial(),
			scheduleAddCustom(
				source("Old weekend", "2026-07-05", ScheduleType.CUSTOM),
			),
		);
		state = scheduleReducer(
			state,
			scheduleImportCustomBatch({records, mode: "replace", range}),
		);
		expect(scheduleRecords(state.baseSchedule).map((r) => r.name)).toEqual([
			"Unaffected",
			"Actual course",
		]);
		expect(state.replacementRanges).toEqual([range]);
		state = scheduleReducer(
			state,
			scheduleFetch({
				schedule: [...official, source("New official hash", "2026-07-05")],
				semesterId: "2026-3",
			}),
		);
		expect(scheduleRecords(state.baseSchedule).map((r) => r.name)).toEqual([
			"Actual course",
			"Unaffected",
		]);
		expect(official[0].activeTime.base).toHaveLength(1);
	});
	it("does not let official refresh deduplicate away imported replacements", () => {
		const identical = scheduleRecords([official[0]]);
		let state = scheduleReducer(
			initial(),
			scheduleImportCustomBatch({records: identical, mode: "replace", range}),
		);
		state = scheduleReducer(
			state,
			scheduleFetch({schedule: official, semesterId: "2026-3"}),
		);
		expect(
			state.baseSchedule.filter((s) => s.type === ScheduleType.CUSTOM)[0]
				.activeTime.base,
		).toHaveLength(1);
	});
	it("restores official data only when the suppression is explicitly cleared", () => {
		let state = scheduleReducer(
			initial(),
			scheduleImportCustomBatch({records, mode: "replace", range}),
		);
		state = scheduleReducer(state, scheduleClearImportOverrides());
		state = scheduleReducer(
			state,
			scheduleFetch({schedule: official, semesterId: "2026-3"}),
		);
		expect(scheduleRecords(state.baseSchedule)).toHaveLength(3);
		expect(scheduleReducer(state, scheduleClear()).replacementRanges).toEqual(
			[],
		);
	});
	it("does not modify the schedule for empty or invalid replacement batches", () => {
		const before = initial();
		for (const batch of [
			[],
			[{...records[0], end: records[0].start}],
			[{...records[0], start: NaN}],
		]) {
			expect(
				scheduleReducer(
					before,
					scheduleImportCustomBatch({records: batch, mode: "replace", range}),
				),
			).toBe(before);
		}
	});
	it("rechecks duplicates against the latest state at commit time", () => {
		const refreshed = scheduleReducer(
			initial(),
			scheduleAddCustom(
				source("Actual course", "2026-07-04", ScheduleType.CUSTOM),
			),
		);
		const next = scheduleReducer(
			refreshed,
			scheduleImportCustomBatch({records, mode: "append", range}),
		);
		expect(scheduleRecords(next.baseSchedule)).toHaveLength(3);
	});
	it("preserves replacement ranges and exact times through persistence and refresh", () => {
		const state = scheduleReducer(
			initial(),
			scheduleImportCustomBatch({records, mode: "replace", range}),
		);
		const restored = migrateScheduleState(
			deserializeSchedule(JSON.parse(JSON.stringify(serializeSchedule(state)))),
			options.startDate,
			7,
		);
		expect(restored.replacementRanges).toEqual([range]);
		expect(
			dayjs.isDayjs(
				restored.baseSchedule.find((s) => s.type === ScheduleType.CUSTOM)!
					.activeTime.base[0].beginTime,
			),
		).toBe(true);
		const refreshed = scheduleReducer(
			restored,
			scheduleFetch({schedule: official, semesterId: "2026-3"}),
		);
		expect(scheduleRecords(refreshed.baseSchedule).map((r) => r.name)).toEqual([
			"Actual course",
			"Unaffected",
		]);
	});
	it("does not strip a newly imported numeric title on every restart", () => {
		const state = scheduleReducer(
			initial(),
			scheduleAddCustom(
				source("202607 weekend", "2026-07-04", ScheduleType.CUSTOM),
			),
		);
		const restored = migrateScheduleState(
			deserializeSchedule(JSON.parse(JSON.stringify(serializeSchedule(state)))),
			options.startDate,
			7,
		);
		expect(restored.baseSchedule.at(-1)!.name).toBe("202607 weekend");
	});
	it("still migrates old week/period slices when an earlier official event is empty", () => {
		const state = {
			...initial(),
			baseSchedule: [
				{...official[0], activeTime: {base: []}},
				{
					...source("000001Old custom", "2026-07-04", ScheduleType.CUSTOM),
					activeTime: {
						base: [
							{activeWeeks: [1, 2], dayOfWeek: 6, begin: 1, end: 2},
						] as never,
					},
				},
			],
		};
		const migrated = migrateScheduleState(state, "2026-06-29", 5);
		expect(migrated.baseSchedule[1].name).toBe("Old custom");
		expect(
			migrated.baseSchedule[1].activeTime.base.map((s) =>
				s.beginTime.format("YYYY-MM-DD HH:mm"),
			),
		).toEqual(["2026-07-04 08:00", "2026-07-11 08:00"]);
	});
});
