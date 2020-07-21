import dayjs from "dayjs";

export enum SemesterType {
	SPRING,
	SUMMER,
	AUTUMN,
}

// Currently only supports 2020-Summer
// In the near future versions it shall allow automatic update

export class Calendar {
	date: dayjs.Dayjs;

	constructor(config: dayjs.ConfigType | number, rest?: number) {
		if (rest === undefined) {
			this.date = dayjs(config);
		} else {
			this.date = Calendar.firstDay.date.add(
				((config as number) - 1) * 7 + rest - 1,
				"day",
			);
		}
	}

	get weekNumber(): number {
		return Math.floor(this.diff(Calendar.firstDay) / 604800000) + 1;
	}

	get dayOfWeek(): number {
		return this.date.day();
	}

	diff = (other: Calendar) => this.date.diff(other.date);

	static firstDay = new Calendar("2020-06-22");
	static weekCount = 12;
	static semesterType = SemesterType.SUMMER;
	static semesterId = "2019-2020-3";
}
