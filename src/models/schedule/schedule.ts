import {Calendar} from "../../utils/calendar";

export enum LessonType {
	PRIMARY,
	SECONDARY,
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

export interface Lesson {
	type: LessonType;
	title: string;
	locale: string;
	week: number; // When used as hidden rules, -1 for ALL, 0 for REPEAT, others for the week to be hidden.
	dayOfWeek: number;
	begin: number;
	end: number;
}

// TODO: support exam
export interface Exam {
	title: string;
	locale: string;
	week: number;
	dayOfWeek: number;
}

export const parseJSON = (json: any[]): [Lesson[], Exam[]] => {
	const primaryList: Lesson[] = [];
	const examList: Exam[] = [];
	json.forEach((o) => {
		try {
			switch (o.fl) {
				case "上课": {
					const title = o.nr;
					const locale = o.dd || "";
					const date = new Calendar(o.nq);
					const week = date.weekNumber;
					const dayOfWeek = date.dayOfWeek;
					const begin = beginMap[o.kssj];
					const end = endMap[o.jssj];
					if (
						primaryList.length > 0 &&
						title === primaryList[primaryList.length - 1].title &&
						locale === primaryList[primaryList.length - 1].locale &&
						week === primaryList[primaryList.length - 1].week &&
						dayOfWeek === primaryList[primaryList.length - 1].dayOfWeek &&
						begin <= primaryList[primaryList.length - 1].end + 1
					) {
						primaryList[primaryList.length - 1].end = end;
					} else {
						primaryList.push({
							type: LessonType.PRIMARY,
							title,
							locale,
							week,
							dayOfWeek,
							begin,
							end,
						});
					}
					break;
				}
				case "考试": {
					const date = new Calendar(o.nq);
					const week = date.weekNumber;
					const dayOfWeek = date.dayOfWeek;
					examList.push({
						title: o.nr,
						locale: o.dd || "",
						week,
						dayOfWeek,
					});
					break;
				}
			}
		} catch (e) {
			console.error(e);
		}
	});
	return [primaryList, examList];
};

// Note: no '}' at the end.
export const parseScript = (script: string): Lesson[] => {
	const result: Lesson[] = [];
	const segments = script.split("strHTML =").slice(1);
	const beginList = [1, 3, 6, 8, 10, 12];
	const endList = [2, 5, 7, 9, 11, 14];
	segments.forEach((seg) => {
		const position = seg.substring(
			seg.indexOf("getElementById") + 16,
			seg.indexOf("').inner"),
		);
		const dayOfWeek = Number(position[3]);
		const sessionIndex = Number(position[1]);
		const begin = beginList[sessionIndex - 1];
		const end = endList[sessionIndex - 1];
		const title = seg.substring(seg.indexOf("<b>") + 3, seg.indexOf("</b>"));
		const detail = seg
			.substring(seg.indexOf("</a>") + 4, seg.indexOf(";") - 1)
			.replace(/\s/, "");

		const add = (week: number) => {
			result.push({
				type: LessonType.SECONDARY,
				title,
				locale: "",
				week,
				dayOfWeek,
				begin,
				end,
			});
		};

		const res1 = /第([\d]+)周/.exec(detail);
		if (res1 !== null) {
			add(Number(res1[1]));
		} else {
			const res2 = /第([\d]+)[-~]([\d]+)周/.exec(detail);
			if (res2 !== null) {
				const left = Number(res2[1]);
				const right = Number(res2[2]);
				for (let i = left; i <= right; i++) {
					add(i);
				}
			} else if (detail.indexOf("单周") !== -1) {
				[1, 3, 5, 7, 9, 11, 13, 15].forEach((i) => add(i));
			} else if (detail.indexOf("双周") !== -1) {
				[2, 4, 6, 8, 10, 12, 14, 16].forEach((i) => add(i));
			}
		}
	});
	return result;
};

export const matchHiddenRules = (lesson: Lesson, rules: Lesson[]) =>
	rules.some(
		(it) =>
			it.type === lesson.type &&
			it.title === lesson.title &&
			(it.week === -1 ||
				(it.dayOfWeek === lesson.dayOfWeek &&
					it.begin === lesson.begin &&
					it.end === lesson.end &&
					(it.week === 0 || it.week === lesson.week))),
	);
