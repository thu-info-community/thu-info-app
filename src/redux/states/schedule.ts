import {Exam, Lesson} from "../../models/schedule/schedule";

export interface PrimarySchedule {
	primary: Lesson[];
	exam: Exam[];
}

export interface SecondarySchedule {
	secondary: Lesson[];
}

export interface Schedule extends PrimarySchedule, SecondarySchedule {}
