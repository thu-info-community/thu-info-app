import {Calendar} from "../../utils/calendar";

enum LessonType {
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
	week: number;
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

export const parseJSON = (json: any[]) => {
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
