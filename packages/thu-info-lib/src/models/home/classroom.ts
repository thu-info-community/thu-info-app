export interface Classroom {
    name: string;
    weekNumber: number;
    searchName: string;
}

export enum ClassroomStatus {
    TEACHING,
    EXAM,
    BORROWED,
    DISABLED,
    RESERVED_FOR_COMPAT,
    AVAILABLE,
}

export interface ClassroomState {
    name: string;
    status: ClassroomStatus[];  // an array of 42(=7*6) `ClassroomStatus`es (starting from Monday)
}

export interface ClassroomStateResult {
    validWeekNumbers: number[];
    currentWeekNumber: number;
    datesOfCurrentWeek: [string, string, string, string, string, string, string];
    classroomStates: ClassroomState[];
}
