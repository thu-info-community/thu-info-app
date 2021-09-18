import dayjs from "dayjs";

export enum SemesterType {
    SPRING,
    SUMMER,
    AUTUMN,
}

export class Calendar {
    date: dayjs.Dayjs;

    constructor(config?: dayjs.ConfigType | number, rest?: number) {
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

    get weekNumberCoerced(): number {
        const weekNumber = this.weekNumber;
        if (weekNumber > Calendar.weekCount) {
            return Calendar.weekCount;
        } else if (weekNumber < 1) {
            return 1;
        } else {
            return weekNumber;
        }
    }

    get dayOfWeek(): number {
        const day = this.date.day();
        return day === 0 ? 7 : day;
    }

    diff = (other: Calendar) => this.date.diff(other.date);

    static firstDay = new Calendar("2021-09-13");
    static weekCount = 18;
    static semesterType = SemesterType.AUTUMN;
    static semesterId = "2021-2022-1";
}
