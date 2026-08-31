import dayjs from "dayjs";
import {
	ScheduleTime,
	ScheduleType,
} from "@thu-info/lib/src/models/schedule/schedule";
import type {ScheduleState} from "../redux/slices/schedule";

export const serializeSchedule = (state: ScheduleState) => {
	const transform = (time: ScheduleTime) => ({
		base: time.base.map(
			(slice) =>
				({
					dayOfWeek: slice.dayOfWeek,
					beginTime: slice.beginTime.valueOf(),
					endTime: slice.endTime.valueOf(),
				}) as never,
		),
	});
	return {
		...state,
		baseSchedule: state.baseSchedule.map((schedule) => ({
			...schedule,
			activeTime: transform(schedule.activeTime),
			delOrHideTime: transform(schedule.delOrHideTime),
		})),
	};
};

export const deserializeSchedule = (state: ScheduleState): ScheduleState => {
	const transform = (time: ScheduleTime): ScheduleTime => ({
		base: time.base.map((slice) =>
			slice.beginTime
				? {
						dayOfWeek: slice.dayOfWeek,
						beginTime: dayjs(slice.beginTime),
						endTime: dayjs(slice.endTime),
					}
				: slice,
		),
	});
	return {
		...state,
		baseSchedule: state.baseSchedule.map((schedule) => ({
			...schedule,
			activeTime: transform(schedule.activeTime),
			delOrHideTime: transform(schedule.delOrHideTime),
		})),
	};
};

/** Inspect each time slice, not the first event: replacement can leave that event empty. */
export const migrateScheduleState = (
	state: ScheduleState,
	firstDay: string,
	fromVersion: number,
): ScheduleState => {
	const begin = [
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
	const end = [
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
	const transform = (time: ScheduleTime): ScheduleTime => ({
		base: time.base.flatMap((slice) => {
			if (slice.beginTime !== undefined) {
				return [slice];
			}
			const old = slice as unknown as {
				activeWeeks: number[];
				dayOfWeek: number;
				begin: number;
				end: number;
			};
			return old.activeWeeks.map((week) => {
				const date = dayjs(firstDay)
					.add((week - 1) * 7 + old.dayOfWeek - 1, "day")
					.format("YYYY-MM-DD");
				return {
					dayOfWeek: old.dayOfWeek,
					beginTime: dayjs(`${date}T${begin[old.begin]}`),
					endTime: dayjs(`${date}T${end[old.end]}`),
				};
			});
		}),
	});
	const name = (value: string) =>
		fromVersion < 7 ? value.replace(/^\d{6}/, "") : value;
	return {
		...state,
		baseSchedule: (state.baseSchedule ?? []).map((schedule) => ({
			...schedule,
			name:
				schedule.type === ScheduleType.CUSTOM
					? name(schedule.name)
					: schedule.name,
			activeTime: transform(schedule.activeTime),
			delOrHideTime: transform(schedule.delOrHideTime),
		})),
		shortenMap: Object.fromEntries(
			Object.entries(state.shortenMap ?? {}).map(([key, value]) => [
				name(key),
				value,
			]),
		),
	};
};
