import {
	Schedule,
	ScheduleType,
	TimeSlice,
} from "@thu-info/lib/src/models/schedule/schedule";

export const beginTime = [
	"",
	"08:00",
	"08:50",
	"09:50",
	"10:40",
	"11:30",
	"13:30",
	"14:20",
	"15:20",
	"16:10",
	"17:05",
	"17:55",
	"19:20",
	"20:10",
	"21:00",
];
export const endTime = [
	"",
	"08:45",
	"09:35",
	"10:35",
	"11:25",
	"12:15",
	"14:15",
	"15:05",
	"16:05",
	"16:55",
	"17:50",
	"18:40",
	"20:05",
	"20:55",
	"21:45",
];

const minutes = (time: string) => {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
};

export const formatScheduleMinute = (minute: number) =>
	`${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

export interface ScheduleLayoutEntry {
	schedule: Schedule;
	slice: TimeSlice;
}

export interface ScheduleRow {
	kind: "period" | "gap" | "hour";
	period?: number;
	begin: number;
	end: number;
	top: number;
	height: number;
}

export interface ScheduleLayoutBlock<T> {
	entry: T;
	top: number;
	height: number;
	compact?: boolean;
	timeLabel?: string;
}

export interface ScheduleLayout<T> {
	rows: ScheduleRow[];
	blocks: ScheduleLayoutBlock<T>[];
	height: number;
}

export const isPersonalSchedule = (schedule: Schedule) =>
	schedule.type === ScheduleType.CUSTOM || schedule.category === "个人日历";

const sliceMinutes = (slice: TimeSlice) => ({
	begin: Math.max(
		0,
		slice.beginTime.diff(slice.beginTime.startOf("day"), "minute"),
	),
	end: Math.min(
		1440,
		slice.endTime.diff(slice.beginTime.startOf("day"), "minute"),
	),
});

/** The same rows drive the axis, cards and hit testing. Hidden entries are filtered by the caller. */
export function buildScheduleLayout<T extends ScheduleLayoutEntry>(
	entries: T[],
	options: {
		classPeriods: boolean;
		periodHeight: number;
		cardMinHeight?: number;
		minuteHeight: number;
		startMinute: number;
	},
): ScheduleLayout<T> {
	const rows: ScheduleRow[] = [];
	const blocks: ScheduleLayoutBlock<T>[] = [];
	const items = entries
		.map((entry, index) => ({entry, index, ...sliceMinutes(entry.slice)}))
		.filter(({begin, end}) => end > begin);
	if (!options.classPeriods) {
		for (let begin = options.startMinute; begin < 1440; begin += 60) {
			rows.push({
				kind: "hour",
				begin,
				end: begin + 60,
				top: (begin - options.startMinute) * options.minuteHeight,
				height: 60 * options.minuteHeight,
			});
		}
		items.forEach(({entry, begin, end}) => {
			if (end > options.startMinute) {
				const top =
					(Math.max(begin, options.startMinute) - options.startMinute) *
					options.minuteHeight;
				blocks.push({
					entry,
					top,
					height: (end - options.startMinute) * options.minuteHeight - top,
				});
			}
		});
		return {
			rows,
			blocks,
			height: (1440 - options.startMinute) * options.minuteHeight,
		};
	}

	let top = 0;
	const cardHeight = Math.max(
		options.cardMinHeight ?? 52,
		options.periodHeight,
	);
	const addGap = (begin: number, end: number) => {
		const occupants = items.filter(
			(item) => item.begin < end && item.end > begin,
		);
		const expanded =
			end - begin > 30 &&
			occupants.some(({entry}) => isPersonalSchedule(entry.schedule));
		const counts = new Map<number, number>();
		if (expanded) {
			occupants.sort(
				(a, b) => a.begin - b.begin || a.end - b.end || a.index - b.index,
			);
			occupants.forEach(({entry}) => {
				const day = entry.slice.dayOfWeek;
				const count = counts.get(day) ?? 0;
				blocks.push({
					entry,
					top: top + count * cardHeight,
					height: cardHeight,
					timeLabel: `${entry.slice.beginTime.format("HH:mm")}–${entry.slice.endTime.format("HH:mm")}`,
				});
				counts.set(day, count + 1);
			});
		}
		const height = Math.max(0, ...counts.values()) * cardHeight;
		rows.push({kind: "gap", begin, end, top, height});
		top += height;
	};

	addGap(0, minutes(beginTime[1]));
	for (let period = 1; period < beginTime.length; period++) {
		const begin = minutes(beginTime[period]);
		const end = minutes(endTime[period]);
		rows.push({
			kind: "period",
			period,
			begin,
			end,
			top,
			height: options.periodHeight,
		});
		top += options.periodHeight;
		addGap(end, period === 14 ? 1440 : minutes(beginTime[period + 1]));
	}

	items.forEach(({entry, begin, end}) => {
		const pieces: ScheduleLayoutBlock<T>[] = [];
		rows
			.filter(
				(row) => row.kind === "period" && begin < row.end && end > row.begin,
			)
			.forEach((row) => {
				const pieceTop =
					row.top +
					((Math.max(begin, row.begin) - row.begin) / (row.end - row.begin)) *
						row.height;
				const bottom =
					row.top +
					((Math.min(end, row.end) - row.begin) / (row.end - row.begin)) *
						row.height;
				const previous = pieces[pieces.length - 1];
				if (
					previous &&
					Math.abs(previous.top + previous.height - pieceTop) < 0.001
				) {
					previous.height = bottom - previous.top;
				} else {
					pieces.push({entry, top: pieceTop, height: bottom - pieceTop});
				}
			});
		blocks.push(...pieces);
		if (!pieces.length && !blocks.some((block) => block.entry === entry)) {
			const gap = rows.find(
				(row) => row.kind === "gap" && begin < row.end && end > row.begin,
			);
			if (gap) {
				blocks.push({
					entry,
					top: Math.max(0, Math.min(top - 28, gap.top - 14)),
					height: 28,
					compact: true,
					timeLabel: `${entry.slice.beginTime.format("HH:mm")}–${entry.slice.endTime.format("HH:mm")}`,
				});
			}
		}
	});
	// A time slice stays one card even when it crosses expanded breaks.
	// Group by the occurrence, not the schedule: recurring plans remain separate.
	const continuousBlocks = new Map<T, ScheduleLayoutBlock<T>>();
	blocks.forEach((block) => {
		const existing = continuousBlocks.get(block.entry);
		if (existing) {
			const bottom = Math.max(
				existing.top + existing.height,
				block.top + block.height,
			);
			existing.top = Math.min(existing.top, block.top);
			existing.height = bottom - existing.top;
			existing.timeLabel ??= block.timeLabel;
		} else {
			continuousBlocks.set(block.entry, {...block});
		}
	});
	// Boundary cards stay tappable above the adjacent courses.
	const cards = [...continuousBlocks.values()].sort(
		(a, b) => Number(!!a.compact) - Number(!!b.compact),
	);
	return {rows, blocks: cards, height: top};
}

export function scheduleRowAt(
	rows: ScheduleRow[],
	y: number,
): ScheduleRow | undefined {
	const visible = rows.filter((row) => row.height > 0);
	return (
		visible.find((row) => y >= row.top && y < row.top + row.height) ??
		(y < 0 ? visible[0] : visible[visible.length - 1])
	);
}

export function scheduleAddTime(row: ScheduleRow, y = row.top) {
	if (row.kind === "gap") {
		const begin = row.begin === 0 ? Math.max(0, row.end - 30) : row.begin;
		return {
			begin,
			end: Math.min(begin + 30, row.end, 1439),
			custom: true,
			periodBegin: 1,
			periodEnd: 2,
		};
	}
	const minute =
		row.begin + ((y - row.top) / row.height) * (row.end - row.begin);
	let period = row.period ?? 1;
	if (row.kind === "hour") {
		let distance = Infinity;
		for (let i = 1; i < beginTime.length; i++) {
			const begin = minutes(beginTime[i]);
			const end = minutes(endTime[i]);
			if (minute >= begin && minute < end) {
				period = i;
				break;
			}
			const d = Math.abs(minute - (begin + end) / 2);
			if (d < distance) {
				distance = d;
				period = i;
			}
		}
	}
	const periodEnd = Math.min(14, period + 1);
	return {
		begin: minutes(beginTime[period]),
		end: minutes(endTime[periodEnd]),
		custom: false,
		periodBegin: period,
		periodEnd,
	};
}
