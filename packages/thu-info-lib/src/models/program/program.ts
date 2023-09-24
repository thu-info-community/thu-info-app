/**
 * 若干定义的阐释：
 * @def 弹性课组 - 指的是没有“应修门数”要求的课组
 * @todo 优化这里的接口设计，现在暂且是十分不优美的，不过考虑到该功能暂且不上，先搁置
 */

export enum CourseState {
    COMPLETED,
    ELECTED,
    NOT_COMPLETED,
}

export interface CourseItemBase {
    id: string,
    name: string,
    credit: number,
}

export interface CourseItemCompletion extends CourseItemBase {
    point?: number, // 未修课程、退课课程、选课中课程、PF 课程不应当具有绩点
    grade?: string, // 未修课程、选课中课程不应当具有成绩，退课课程成绩为 W
    state: CourseState,
}

export interface CourseItemFull extends CourseItemBase {
    dumb?: undefined, // 只是为了过 lint
}

export interface CourseItemUncompletion extends CourseItemBase {
    state: CourseState,
}

export enum CourseType {
    COMPULSORY,
    RESTRICTED,
    ELECTIVE,
    EXCLUDED,
}

export interface CourseSetBase {
    setName: string,
    type: CourseType,
}

export interface CourseSetCompletion extends CourseSetBase {
    course: CourseItemCompletion[],
    requiredCredit?: number,
    completedCredit?: number,
    requiredCourseNum?: number,
    completedCourseNum?: number,
    fullCompleted: boolean,
}

export interface CourseSetFull extends CourseSetBase {
    course: CourseItemFull[],
}

export interface CourseSetUncompletion extends CourseSetBase {
    course: CourseItemUncompletion[],
    uncompletedCredit?: number, // 该字段仅对弹性课组有效
}

export interface ProgramCompletion {
    courseSet: CourseSetCompletion[],
    completedCredit: number,
    compulsoryCredit: number,
    restrictedCredit: number,
    electiveCredit: number,
    duplicatedCourse: string[],
}

export interface ProgramFull {
    courseSet: CourseSetFull[],
}

export interface ProgramUncompletion {
    courseSet: CourseSetUncompletion[],
}

export type Program = ProgramCompletion | ProgramFull | ProgramUncompletion;