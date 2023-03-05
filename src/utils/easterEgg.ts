import {
	Schedule,
	ScheduleType,
} from "thu-info-lib/dist/models/schedule/schedule";

export const EasterEggSchedule: Schedule = {
	name: "回笼觉设计与梦境工程",
	location: "2.0*0.9的宿舍床",
	type: ScheduleType.PRIMARY,
	activeTime: {base: [{dayOfWeek: 6, begin: 1, end: 5, activeWeeks: [6]}]},
	delOrHideTime: {base: []},
};
