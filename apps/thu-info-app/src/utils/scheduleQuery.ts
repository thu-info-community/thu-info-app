import {Dayjs} from "dayjs";
import md5 from "md5";
import {getWeekFromTime} from "@thu-info/lib/src/models/schedule/schedule";
import {StoredSchedule} from "../redux/scheduleData";

export interface ScheduleQueryContext {
	firstDay: string;
	weekCount: number;
	shortenMap: Record<string, string | undefined>;
	colorList: string[];
}

export interface DayScheduleItem {
	name: string;
	location: string;
	from: string;
	to: string;
	beginTime: Dayjs;
	endTime: Dayjs;
	color: string;
	localId: string;
	// Fields below are only consumed by the schedule detail navigation.
	id?: number;
	sourceName: string;
	alias: string;
	week: number;
	dayOfWeek: number;
}

// Extracted from HomeScheduleSection so the home screen and home-screen
// widgets always agree on what "schedules of a day" means.
export const selectDaySchedule = (
	schedules: StoredSchedule[],
	dayOfWeek: number,
	now: Dayjs,
	{firstDay, weekCount, shortenMap, colorList}: ScheduleQueryContext,
): DayScheduleItem[] => {
	// dayOfWeek use 8 to specify Monday of next week
	let _week = getWeekFromTime(now, firstDay);
	if (dayOfWeek === 8) {
		_week += 1;
		dayOfWeek = 1;
	}
	const a: DayScheduleItem[] = [];
	for (const s of schedules) {
		for (const ss of s.activeTime.base) {
			const sliceWeek = getWeekFromTime(ss.beginTime, firstDay);
			if (sliceWeek === _week && sliceWeek >= 1 && sliceWeek <= weekCount) {
				if (ss.dayOfWeek === dayOfWeek) {
					a.push({
						name: shortenMap[s.localId] ?? s.name,
						location: s.location,
						from: ss.beginTime.format("HH:mm"),
						to: ss.endTime.format("HH:mm"),
						beginTime: ss.beginTime,
						endTime: ss.endTime,
						color: colorList[parseInt(md5(s.name).substr(0, 6), 16) % colorList.length],
						localId: s.localId,
						id: ss.id,
						sourceName: s.name,
						alias: shortenMap[s.localId] ?? "",
						week: _week,
						dayOfWeek: ss.dayOfWeek,
					});
				}
			}
		}
	}
	a.sort((x, y) => x.beginTime.diff(y.beginTime));
	return a;
};
