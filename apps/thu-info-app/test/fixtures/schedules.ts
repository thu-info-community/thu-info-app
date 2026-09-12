import dayjs from "dayjs";
import {
	Schedule,
	ScheduleType,
	TimeSlice,
} from "@thu-info/lib/src/models/schedule/schedule";
export const autumn = {
	firstDay: "2025-09-15",
	weekCount: 18,
	semesterId: "2025-2026-1",
};
export const summer = {
	firstDay: "2025-06-30",
	weekCount: 11,
	semesterId: "2024-2025-3",
};
export const time = (
	date: string,
	begin = "14:00",
	end = "15:00",
	id?: number,
): TimeSlice => ({
	dayOfWeek: dayjs(date).day() || 7,
	beginTime: dayjs(`${date} ${begin}`),
	endTime: dayjs(`${date} ${end}`),
	...(id === undefined ? {} : {id}),
});
export const plan = (
	slices: TimeSlice[] = [time("2025-09-17")],
	fields: Partial<Schedule> = {},
): Schedule => ({
	name: "组会",
	location: "A",
	hash: "组会@A",
	type: ScheduleType.CUSTOM,
	activeTime: {base: slices},
	delOrHideTime: {base: []},
	...fields,
});
