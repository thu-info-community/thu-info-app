import {Calendar} from "../../utils/calendar";

export enum ScheduleType {
	PRIMARY,
	SECONDARY,
	EXAM,
	CUSTOM,
}

const beginMap: {[key: string]: number} = {
	"08:00": 1,
	"08:50": 2,
	"09:50": 3,
	"10:40": 4,
	"11:30": 5,
	"13:30": 6,
	"14:20": 7,
	"15:20": 8,
	"16:10": 9,
	"17:05": 10,
	"17:55": 11,
	"19:20": 12,
	"20:10": 13,
	"21:00": 14,
};

const endMap: {[key: string]: number} = {
	"08:45": 1,
	"09:35": 2,
	"10:35": 3,
	"11:25": 4,
	"12:15": 5,
	"14:15": 6,
	"15:05": 7,
	"16:05": 8,
	"16:55": 9,
	"17:50": 10,
	"18:40": 11,
	"20:05": 12,
	"20:55": 13,
	"21:45": 14,
};

const examBeginMap: {[key: string]: number} = {
	"8:00": 1,
	"14:30": 7,
	"19:00": 12,
};

const examEndMap: {[key: string]: number} = {
	"10:00": 3,
	"16:30": 9,
	"21:00": 13,
};

export interface TimeBlock {
	week: number;
	dayOfWeek: number;
	begin: number;
	end: number;
}

export interface Schedule {
	name: string;
	location: string;
	activeTime: TimeBlock[];
	delOrHideTime: TimeBlock[];
	type: ScheduleType;
}

export const activeWeek = (week: number, schedule: Schedule) => {
	let res: boolean = false;
	schedule.activeTime.forEach((val) => (res = res || week === val.week));
	return res;
};

export const mergeTimeBlocks = (schedule: Schedule) => {
	schedule.activeTime.sort((a, b) => {
		if (a.week > b.week) {
			return 1;
		} else if (a.dayOfWeek > b.dayOfWeek) {
			return 1;
		} else if (a.begin > b.begin) {
			return 1;
		} else {
			return -1;
		}
	});
	for (let i = 0; i < schedule.activeTime.length; ++i) {
		if (
			i !== schedule.activeTime.length - 1 &&
			schedule.activeTime[i].end + 1 === schedule.activeTime[i + 1].begin &&
			schedule.activeTime[i].week === schedule.activeTime[i + 1].week &&
			schedule.activeTime[i].dayOfWeek === schedule.activeTime[i + 1].dayOfWeek
		) {
			schedule.activeTime[i].end = schedule.activeTime[i + 1].end;
			schedule.activeTime.splice(i + 1, 1);
		}
	}
};

export const addActiveTimeBlocks = (
	week: number,
	dayOfWeek: number,
	begin: number,
	end: number,
	schedule: Schedule,
) => {
	schedule.activeTime.push({
		week: week,
		dayOfWeek: dayOfWeek,
		begin: begin,
		end: end,
	});
};

export const hideOnce = (time: TimeBlock, schedule: Schedule) => {
	let ind: number = schedule.activeTime.indexOf(time);
	if (ind !== -1) {
		schedule.delOrHideTime.push(schedule.activeTime[ind]);
		schedule.activeTime.splice(ind, 1);
	}
};

export const unhideOnce = (time: TimeBlock, schedule: Schedule) => {
	let ind: number = schedule.delOrHideTime.indexOf(time);
	if (ind !== -1) {
		schedule.activeTime.push(schedule.activeTime[ind]);
		schedule.delOrHideTime.splice(ind, 1);
	}
};

export const parseJSON = (json: any[]): Schedule[] => {
	let scheduleList: Schedule[] = [];
	json.forEach((o) => {
		try {
			const date = new Calendar(o.nq);
			switch (o.fl) {
				case "上课": {
					// TODO: use id to detect duplication
					let lessonList = scheduleList.filter((val) => val.name === o.nr);
					let lesson: Schedule;
					if (lessonList.length) {
						lesson = lessonList[0];
					} else {
						scheduleList.push({
							name: o.nr,
							location: o.dd || "",
							activeTime: [],
							delOrHideTime: [],
							type: ScheduleType.PRIMARY,
						});
						lesson = scheduleList[scheduleList.length - 1];
					}
					addActiveTimeBlocks(
						date.weekNumber,
						date.dayOfWeek,
						beginMap[o.kssj],
						endMap[o.jssj],
						lesson,
					);
					break;
				}
				case "考试": {
					scheduleList.push({
						name: o.nr,
						location: o.dd || "",
						activeTime: [],
						delOrHideTime: [],
						type: ScheduleType.EXAM,
					});
					addActiveTimeBlocks(
						date.weekNumber,
						date.dayOfWeek,
						examBeginMap[o.kssj],
						examEndMap[o.jssj],
						scheduleList[scheduleList.length - 1],
					);
					break;
				}
			}
		} catch (e) {
			console.error(e);
		}
	});
	return scheduleList;
};

export const parseSecondaryWeek = (
	src: string,
	callback: (week: number) => void,
): boolean => {
	let healthy = true;
	src.split(",").forEach((segment) => {
		if (segment.indexOf("-") === -1) {
			const week = Number(segment);
			if (isNaN(week)) {
				healthy = false;
			} else {
				callback(week);
			}
		} else {
			const partials = segment.split("-");
			if (partials.length === 2) {
				const x = Number(partials[0]);
				const y = Number(partials[1]);
				if (isNaN(x) || isNaN(y) || x > y) {
					healthy = false;
				} else {
					for (let i = x; i <= y; i++) {
						callback(i);
					}
				}
			} else {
				healthy = false;
			}
		}
	});
	return healthy;
};

// Note: no '}' at the end.
export const parseScript = (
	script: string,
	verbose: boolean = false,
): Schedule[] | [string, string, boolean][] => {
	const result: Schedule[] = [];
	const verboseResult: [string, string, boolean][] = [];
	const segments = script.split("strHTML =").slice(1);
	const beginList = [1, 3, 6, 8, 10, 12];
	const endList = [2, 5, 7, 9, 11, 14];
	const reg = /"<span onmouseover=\\"return overlib\('(.+?)'\);\\" onmouseout='return nd\(\);'>(.+?)<\/span>";[ \n\t\r]+?document.getElementById\('(.+?)'\).innerHTML \+= strHTML\+"<br>";/;
	segments.forEach((seg) => {
		reg.test(seg);
		const position = RegExp.$3;
		const dayOfWeek = Number(position[3]);
		const sessionIndex = Number(position[1]);
		const begin = beginList[sessionIndex - 1];
		const end = endList[sessionIndex - 1];
		const title = RegExp.$2;
		const detail = RegExp.$1.replace(/\s/g, "");

		console.log(RegExp.$1);

		const add = (week: number) => {
			let lessonList = result.filter((val) => val.name === title);
			let lesson: Schedule;
			if (lessonList.length) {
				lesson = lessonList[0];
			} else {
				result.push({
					name: title,
					location: position,
					activeTime: [],
					delOrHideTime: [],
					type: ScheduleType.SECONDARY,
				});
				lesson = result[result.length - 1];
			}
			addActiveTimeBlocks(week, dayOfWeek, begin, end, lesson);
		};

		if (detail.indexOf("单周") !== -1) {
			[1, 3, 5, 7, 9, 11, 13, 15].forEach(add);
			verboseResult.push([title, "单周", true]);
		} else if (detail.indexOf("双周") !== -1) {
			[2, 4, 6, 8, 10, 12, 14, 16].forEach(add);
			verboseResult.push([title, "双周", true]);
		} else if (detail.indexOf("全周") !== -1) {
			[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].forEach(add);
			verboseResult.push([title, "全周", true]);
		} else if (
			detail.indexOf("前八周") !== -1 ||
			detail.indexOf("前8周") !== -1
		) {
			[1, 2, 3, 4, 5, 6, 7, 8].forEach(add);
			verboseResult.push([title, "前八周", true]);
		} else if (
			detail.indexOf("后八周") !== -1 ||
			detail.indexOf("后8周") !== -1
		) {
			[9, 10, 11, 12, 13, 14, 15, 16].forEach(add);
			verboseResult.push([title, "后八周", true]);
		} else {
			const res = /第([\d\-~,]+)周/.exec(detail);
			if (res !== null && res[1]) {
				const healthy = parseSecondaryWeek(res[1], add);
				verboseResult.push([title, res[1], healthy]);
			} else {
				const resEn = /Week([\d\-~,]+)/i.exec(detail);
				if (resEn !== null && resEn[1]) {
					const healthy = parseSecondaryWeek(resEn[1], add);
					verboseResult.push([title, resEn[1], healthy]);
				} else {
					verboseResult.push([title, detail, false]);
				}
			}
		}
	});
	return verbose ? verboseResult : result;
};
