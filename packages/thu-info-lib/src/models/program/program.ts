export enum CourseState {
    COMPLETED,
    ELECTED,
    NON_ELECTED,
}

export interface CourseItem {
    id: number,
    name: string,
    credit: number,
    point: number,
    grade: string,
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