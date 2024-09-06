export interface Semester {
    firstDay: string;   // yyyy-MM-dd
    semesterId: string;
    weekCount: number;
}
export interface CalendarData extends Semester {
    nextSemesterList: Semester[];
}
