export enum CourseState {
    COMPLETED,
    ELECTED,
    NOT_ELECTED,
}

export interface CourseItem {
    id: number,
    name: string,
    credit: number,
    point?: number, // 未修课程、退课课程、选课中课程、PF 课程不应当具有绩点
    grade?: string, // 未修课程、选课中课程不应当具有成绩，退课课程成绩为 W
    state: CourseState,
}

export enum CourseType {
    COMPULSORY,
    RESTRICTED,
    ELECTIVE,
    EXCLUDED,
}

export interface CourseSet {
    setName: string,
    type: CourseType,
    course: CourseItem[],
    requiredCredit?: number,
    completedCredit?: number,
    requiredCourseNum?: number,
    completedCourseNum?: number,
    fullCompleted: boolean,
}

export interface Program {
    completedCredit: number,
    compulsoryCredit: number,
    restrictedCredit: number,
    electiveCredit: number,
    duplicatedCourse: string[],
    courseSet: CourseSet[],
}