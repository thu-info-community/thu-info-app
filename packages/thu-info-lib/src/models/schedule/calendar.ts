export interface Semester {
    firstDay: string;   // yyyy-MM-dd
    semesterId: string;
    semesterName: string;
    weekCount: number;
}
export interface CalendarData extends Semester {
    nextSemesterList: Semester[];
}
