import dayjs from "dayjs";
import {Schedule, ScheduleType, scheduleTimeAdd} from "@thu-info/lib/src/models/schedule/schedule";
import {fingerprint, sanitize} from "./util";

export const scheduleId = (schedule: Schedule) => fingerprint(sanitize(schedule));

export const createScheduleFromToolArgs = (
	args: Record<string, unknown>,
	firstDay: string,
	weekCount: number,
): Schedule | undefined => {
	const title = typeof args.title === "string" ? args.title.trim() : "";
	const begin = typeof args.beginTime === "string" ? args.beginTime : "";
	const end = typeof args.endTime === "string" ? args.endTime : "";
	const time = /^([01]\d|2[0-3]):[0-5]\d$/;
	if (
		!title ||
		!time.test(begin) ||
		!time.test(end) ||
		end <= begin ||
		!Number.isInteger(weekCount) ||
		weekCount < 1 ||
		weekCount > 60
	) {
		return undefined;
	}
	const schedule: Schedule = {
		name: title,
		location: typeof args.location === "string" ? args.location : "",
		hash: "",
		type: ScheduleType.CUSTOM,
		activeTime: {base: []},
		delOrHideTime: {base: []},
	};
	const addDate = (date: string) => {
		const start = dayjs(`${date} ${begin}`);
		scheduleTimeAdd(schedule.activeTime, {
			dayOfWeek: start.day() || 7,
			beginTime: start,
			endTime: dayjs(`${date} ${end}`),
		});
	};
	if (args.date !== undefined) {
		if (
			args.dayOfWeek !== undefined ||
			typeof args.date !== "string" ||
			!/^\d{4}-\d{2}-\d{2}$/.test(args.date) ||
			!dayjs(args.date).isValid() ||
			dayjs(args.date).format("YYYY-MM-DD") !== args.date
		) {
			return undefined;
		}
		addDate(args.date);
		return schedule;
	}
	if (
		typeof args.dayOfWeek !== "number" ||
		!Number.isInteger(args.dayOfWeek) ||
		args.dayOfWeek < 1 ||
		args.dayOfWeek > 7 ||
		!dayjs(firstDay).isValid()
	) {
		return undefined;
	}
	const weeks =
		args.weeks === undefined || (Array.isArray(args.weeks) && !args.weeks.length)
			? Array.from({length: weekCount}, (_, i) => i + 1)
			: args.weeks;
	if (
		!Array.isArray(weeks) ||
		weeks.some(
			(week) => typeof week !== "number" || !Number.isInteger(week) || week < 1 || week > weekCount,
		)
	) {
		return undefined;
	}
	for (const week of new Set(weeks)) {
		addDate(
			dayjs(firstDay)
				.add((week - 1) * 7 + args.dayOfWeek - 1, "day")
				.format("YYYY-MM-DD"),
		);
	}
	return schedule;
};
