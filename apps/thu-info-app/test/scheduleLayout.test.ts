import {expect, test} from "@jest/globals";
import dayjs from "dayjs";
import {ScheduleType} from "@thu-info/lib/src/models/schedule/schedule";
import {
	beginTime,
	endTime,
	buildScheduleLayout,
	scheduleRowAt,
	scheduleAddTime,
	ScheduleLayoutEntry,
} from "../src/utils/scheduleLayout";

const options = {
	classPeriods: true,
	periodHeight: 45,
	minuteHeight: 1,
	startMinute: 480,
};
const entry = (
	begin: string,
	end: string,
	day = 1,
	type = ScheduleType.CUSTOM,
	category?: string,
): ScheduleLayoutEntry => {
	const slice = {
		dayOfWeek: day,
		beginTime: dayjs(`2026-09-14T${begin}:00`),
		endTime: dayjs(`2026-09-14T${end}:00`),
	};
	return {
		slice,
		schedule: {
			name: `${begin}-${end}`,
			location: "测试地点",
			type,
			category,
			hash: `${day}-${begin}`,
			activeTime: {base: [slice]},
			delOrHideTime: {base: []},
		},
	};
};
const layout = (entries: ScheduleLayoutEntry[], scale = 45) =>
	buildScheduleLayout(entries, {...options, periodHeight: scale});

test("all 14 class periods reproduce the historical equal-height coordinates", () => {
	const entries = beginTime
		.slice(1)
		.map((begin, index) =>
			entry(begin, endTime[index + 1], 1, ScheduleType.PRIMARY),
		);
	const result = layout(entries);
	expect(result.height).toBe(630);
	expect(result.blocks.map(({top, height}) => [top, height])).toEqual(
		entries.map((_, i) => [i * 45, 45]),
	);
	expect(layout([entry("08:00", "09:35")]).blocks[0]).toMatchObject({
		top: 0,
		height: 90,
	});
	expect(layout([entry("08:15", "08:30")]).blocks[0]).toMatchObject({
		top: 15,
		height: 15,
	});
});

test("short breaks remain collapsed and their standalone plans stay on the boundary", () => {
	const result = layout([
		entry("09:40", "09:45"),
		entry("09:50", "10:35", 1, ScheduleType.PRIMARY),
	]);
	expect(result.height).toBe(630);
	expect(
		result.rows
			.filter((row) => row.kind === "gap")
			.every((row) => row.height === 0),
	).toBe(true);
	expect(result.blocks[result.blocks.length - 1]).toMatchObject({
		compact: true,
		top: 76,
		height: 28,
	});
});

test("long breaks only expand for personal plans and touching endpoints do not count", () => {
	const result = layout([entry("12:15", "12:45", 1, ScheduleType.PRIMARY)]);
	expect(result.height).toBe(630);
	expect(
		layout([entry("11:30", "12:15"), entry("13:30", "14:15")]).height,
	).toBe(630);
	expect(
		layout([entry("12:20", "12:30", 1, ScheduleType.PRIMARY, "个人日历")])
			.height,
	).toBe(682);
	expect(
		layout([entry("18:45", "19:00")]).rows.find((row) => row.begin === 1120),
	).toMatchObject({height: 52});
});

test("gap cards sort by time and use the busiest visible day, not the weekly sum", () => {
	const late = entry("12:50", "13:20");
	const early = entry("12:20", "12:40");
	const otherDay = entry("12:30", "13:00", 2);
	const result = layout([late, otherDay, early]);
	expect(result.rows.find((row) => row.begin === 735)).toMatchObject({
		top: 225,
		height: 104,
	});
	expect(result.blocks.map((block) => [block.entry, block.top])).toEqual([
		[early, 225],
		[otherDay, 225],
		[late, 277],
	]);
	expect(result.height).toBe(734);
	expect(layout([early]).height).toBe(682);
	expect(layout([]).height).toBe(630);
	expect(layout([early], 70).height).toBe(1050);
	expect(
		buildScheduleLayout([early], {...options, cardMinHeight: 64}).height,
	).toBe(694);
});

test.each([
	["07:30", "08:30", 0, 82],
	["12:00", "14:00", 210, 97],
	["21:30", "22:00", 615, 67],
	["07:30", "22:00", 0, 838],
])(
	"a plan from %s to %s stays one continuous card across expanded boundaries",
	(begin, end, top, height) => {
		const plan = entry(begin, end);
		const result = layout([plan]);
		expect(result.blocks).toHaveLength(1);
		expect(result.blocks[0]).toMatchObject({
			top,
			height,
			timeLabel: `${begin}–${end}`,
		});
		expect(result.blocks[0].entry).toBe(plan);
		expect(plan.slice.beginTime.format("HH:mm")).toBe(begin);
		expect(plan.slice.endTime.format("HH:mm")).toBe(end);
	},
);

test("recurring occurrences remain separate while each spans the boundary continuously", () => {
	const first = entry("07:30", "08:30");
	const second = {...entry("07:30", "08:30", 2), schedule: first.schedule};
	const other = entry("07:00", "07:20");
	const result = layout([first, second, other]);
	expect(result.blocks).toHaveLength(3);
	expect(result.blocks.find((block) => block.entry === first)).toMatchObject({
		top: 52,
		height: 82,
	});
	expect(result.blocks.find((block) => block.entry === second)).toMatchObject({
		top: 0,
		height: 134,
	});
	expect(result.blocks.find((block) => block.entry === other)).toMatchObject({
		top: 0,
		height: 52,
	});
});

test("early and late areas appear only when occupied, with valid natural-time defaults", () => {
	const result = layout([entry("07:00", "07:30"), entry("22:00", "23:00")]);
	expect(result.height).toBe(734);
	const early = result.rows[0];
	const late = result.rows[result.rows.length - 1];
	expect(scheduleAddTime(early)).toMatchObject({
		begin: 450,
		end: 480,
		custom: true,
	});
	expect(scheduleAddTime(late)).toMatchObject({
		begin: 1305,
		end: 1335,
		custom: true,
	});
	expect(layout([]).rows[0].height).toBe(0);
});

test("hit testing follows inserted rows and scaling, including exact row boundaries", () => {
	const result = layout([entry("12:20", "13:00")]);
	const gap = scheduleRowAt(result.rows, 240)!;
	expect(gap.kind).toBe("gap");
	expect(scheduleAddTime(gap)).toMatchObject({
		begin: 735,
		end: 765,
		custom: true,
	});
	expect(scheduleRowAt(result.rows, 277)).toMatchObject({
		kind: "period",
		period: 6,
	});
	expect(scheduleAddTime(scheduleRowAt(result.rows, 277)!)).toMatchObject({
		begin: 810,
		end: 905,
		custom: false,
		periodBegin: 6,
		periodEnd: 7,
	});
	expect(scheduleAddTime(scheduleRowAt(result.rows, 10000)!)).toMatchObject({
		periodBegin: 14,
		periodEnd: 14,
	});
	const scaled = layout([entry("12:20", "13:00")], 70);
	expect(scheduleRowAt(scaled.rows, 420)).toMatchObject({period: 6});
});

test("daily layout preserves minute positioning, including early plans and midnight endings", () => {
	const plan = entry("12:00", "14:00");
	const result = buildScheduleLayout([plan], {...options, classPeriods: false});
	expect(result.blocks).toEqual([{entry: plan, top: 240, height: 120}]);
	expect(result.height).toBe(960);
	expect(scheduleAddTime(scheduleRowAt(result.rows, 360)!, 360)).toMatchObject({
		periodBegin: 6,
		periodEnd: 7,
	});
	const midnight = entry("23:30", "23:59");
	midnight.slice.endTime = midnight.slice.endTime.add(1, "day").startOf("day");
	expect(
		buildScheduleLayout([midnight], {...options, classPeriods: false}).blocks[0]
			.height,
	).toBe(30);
	expect(
		buildScheduleLayout([entry("07:00", "07:30")], {
			...options,
			classPeriods: false,
			startMinute: 420,
		}).blocks[0],
	).toMatchObject({top: 0, height: 30});
});

test("invalid durations produce no cards or extra rows", () => {
	expect(
		layout([entry("12:30", "12:30"), entry("12:45", "12:20")]).blocks,
	).toEqual([]);
});
