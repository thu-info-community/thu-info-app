import dayjs from "dayjs";
import {v4 as uuid} from "uuid";
import {
	Schedule,
	ScheduleTime,
	ScheduleType,
	TimeSlice,
	isInSemester,
} from "@thu-info/lib/src/models/schedule/schedule";

export interface StoredSchedule extends Schedule {
	localId: string;
}

export interface SemesterRange {
	firstDay: string;
	weekCount: number;
}

export interface ScheduleOverride {
	location?: string;
	hidden: ScheduleTime;
}

export interface ScheduleState {
	semesterId: string | undefined;
	baseSchedule: StoredSchedule[];
	shortenMap: Record<string, string | undefined>;
	customCnt: number;
	overrides: Record<string, ScheduleOverride>;
	pendingUploads: {schedule: StoredSchedule; knownOccurrences: string[]}[];
}

export enum Choice {
	ONCE,
	REPEAT,
	ALL,
}

export const sourceScheduleId = (schedule: Schedule, semesterId?: string) =>
	JSON.stringify([semesterId, schedule.type, schedule.category, schedule.hash]);

export const serverOccurrenceKey = (schedule: Schedule, slice: TimeSlice) =>
	JSON.stringify([schedule.type, schedule.category, schedule.hash, slice.id]);

export const storeSchedule = (
	schedule: Schedule,
	semesterId?: string,
): StoredSchedule => ({
	...schedule,
	localId:
		(schedule as Partial<StoredSchedule>).localId ??
		(schedule.type === ScheduleType.CUSTOM
			? `custom:${uuid()}`
			: sourceScheduleId(schedule, semesterId)),
	activeTime: {base: schedule.activeTime.base.map((slice) => ({...slice}))},
	delOrHideTime: {
		base: schedule.delOrHideTime.base.map((slice) => ({...slice})),
	},
});

export const sameTime = (a: TimeSlice, b: TimeSlice) =>
	a.beginTime.isSame(b.beginTime, "minute") &&
	a.endTime.isSame(b.endTime, "minute");

export const sameOccurrence = (a: TimeSlice, b: TimeSlice) =>
	sameTime(a, b) && (a.id === undefined || b.id === undefined || a.id === b.id);

export const samePattern = (a: TimeSlice, b: TimeSlice) =>
	a.dayOfWeek === b.dayOfWeek &&
	a.beginTime.format("HH:mm") === b.beginTime.format("HH:mm") &&
	a.endTime.format("HH:mm") === b.endTime.format("HH:mm");

export const selectOccurrences = (
	schedule: Schedule,
	time: TimeSlice,
	choice: Choice,
	range: SemesterRange,
) =>
	schedule.activeTime.base.filter(
		(slice) =>
			isInSemester(slice.beginTime, range.firstDay, range.weekCount) &&
			(choice === Choice.ALL ||
				(choice === Choice.ONCE
					? sameOccurrence(slice, time)
					: samePattern(slice, time))),
	);

export const schedulesInSemester = <T extends Schedule>(
	schedules: T[],
	range: SemesterRange,
): T[] =>
	schedules
		.map((schedule) => ({
			...schedule,
			activeTime: {
				base: schedule.activeTime.base.filter((slice) =>
					isInSemester(slice.beginTime, range.firstDay, range.weekCount),
				),
			},
		}))
		.filter((schedule) => schedule.activeTime.base.length > 0);

// Keep the entity alongside each conflict; a display name cannot identify it.
export const scheduleConflicts = (
	tester: Schedule,
	schedules: StoredSchedule[],
) =>
	schedules.flatMap((schedule) =>
		schedule.activeTime.base
			.filter((a) =>
				tester.activeTime.base.some(
					(b) => a.endTime >= b.beginTime && a.beginTime <= b.endTime,
				),
			)
			.map((slice) => ({schedule, slice})),
	);

const beginTimes = [
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
const endTimes = [
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

// Persistence and device sync share the same decoder. Legacy slices are
// detected individually, including hidden-only schedules and mixed caches.
export const restoreScheduleTime = (
	time: any,
	firstDay?: string,
): ScheduleTime => ({
	base: (time?.base ?? []).flatMap((slice: any): TimeSlice[] => {
		if (slice.beginTime !== undefined) {
			if (slice.endTime === undefined) {
				throw new Error("Invalid schedule time");
			}
			const beginTime = dayjs(slice.beginTime),
				endTime = dayjs(slice.endTime);
			if (!beginTime.isValid() || !endTime.isValid()) {
				throw new Error("Invalid schedule time");
			}
			return [{...slice, beginTime, endTime}];
		}
		// redux-persist transforms run before migration has access to config.
		if (!firstDay) {
			return [slice];
		}
		return (slice.activeWeeks ?? []).map((week: number) => {
			const date = dayjs(firstDay)
				.add((week - 1) * 7 + slice.dayOfWeek - 1, "day")
				.format("YYYY-MM-DD");
			return {
				dayOfWeek: slice.dayOfWeek,
				id: slice.id,
				beginTime: dayjs(`${date} ${beginTimes[slice.begin]}`),
				endTime: dayjs(`${date} ${endTimes[slice.end]}`),
			};
		});
	}),
});

export const restoreScheduleState = (
	raw: any,
	firstDay?: string,
	semesterId?: string,
): ScheduleState => {
	if (!raw || !Array.isArray(raw.baseSchedule)) {
		throw new Error("Invalid schedule data");
	}
	const term = raw.semesterId ?? semesterId;
	const shortenMap = {...raw.shortenMap};
	const overrides: Record<string, ScheduleOverride> = Object.fromEntries(
		Object.entries(raw.overrides ?? {}).map(([id, value]: [string, any]) => [
			id,
			{...value, hidden: restoreScheduleTime(value.hidden, firstDay)},
		]),
	);
	const baseSchedule = (raw.baseSchedule ?? []).map((schedule: any) => {
		const legacy = [
			...(schedule.activeTime?.base ?? []),
			...(schedule.delOrHideTime?.base ?? []),
		].some((slice: any) => slice.activeWeeks !== undefined);
		const restored = storeSchedule(
			{
				...schedule,
				name:
					legacy && schedule.type === ScheduleType.CUSTOM
						? schedule.name.replace(/^\d{6}/, "")
						: schedule.name,
				activeTime: restoreScheduleTime(schedule.activeTime, firstDay),
				delOrHideTime: restoreScheduleTime(schedule.delOrHideTime, firstDay),
			},
			term,
		);
		if (!schedule.localId && raw.shortenMap?.[schedule.name] !== undefined) {
			shortenMap[restored.localId] = raw.shortenMap[schedule.name];
		}
		if (
			!schedule.localId &&
			restored.type !== ScheduleType.CUSTOM &&
			!overrides[restored.localId]
		) {
			overrides[restored.localId] = {
				location: restored.location,
				hidden: {
					base: restored.delOrHideTime.base.map((slice) => ({...slice})),
				},
			};
		}
		return restored;
	});
	const pendingUploads = (raw.pendingUploads ?? []).map((pending: any) => ({
		...pending,
		schedule: {
			...pending.schedule,
			activeTime: restoreScheduleTime(pending.schedule.activeTime, firstDay),
			delOrHideTime: restoreScheduleTime(
				pending.schedule.delOrHideTime,
				firstDay,
			),
		},
	}));
	return {
		semesterId: term,
		baseSchedule,
		shortenMap,
		customCnt: raw.customCnt ?? 1,
		overrides,
		pendingUploads,
	};
};

// Decode dates before redux-persist invokes its root migration. Identity and
// legacy week migration need config and are deliberately deferred to that step.
export const decodeScheduleState = (raw: any) => ({
	...raw,
	baseSchedule: (raw.baseSchedule ?? []).map((schedule: any) => ({
		...schedule,
		activeTime: restoreScheduleTime(schedule.activeTime),
		delOrHideTime: restoreScheduleTime(schedule.delOrHideTime),
	})),
	overrides: Object.fromEntries(
		Object.entries(raw.overrides ?? {}).map(([id, value]: [string, any]) => [
			id,
			{...value, hidden: restoreScheduleTime(value.hidden)},
		]),
	),
});

export const serializeScheduleState = (state: ScheduleState) => {
	const serializeTime = (time: ScheduleTime) => ({
		base: time.base.map((slice) => ({
			...slice,
			beginTime: slice.beginTime.valueOf(),
			endTime: slice.endTime.valueOf(),
		})),
	});
	return {
		...state,
		baseSchedule: state.baseSchedule.map((schedule) => ({
			...schedule,
			activeTime: serializeTime(schedule.activeTime),
			delOrHideTime: serializeTime(schedule.delOrHideTime),
		})),
		overrides: Object.fromEntries(
			Object.entries(state.overrides).map(([id, value]) => [
				id,
				{...value, hidden: serializeTime(value.hidden)},
			]),
		),
		pendingUploads: state.pendingUploads.map((pending) => ({
			...pending,
			schedule: {
				...pending.schedule,
				activeTime: serializeTime(pending.schedule.activeTime),
				delOrHideTime: serializeTime(pending.schedule.delOrHideTime),
			},
		})),
	};
};
