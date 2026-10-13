import type {ProgramCompletion, ProgramFull} from "../models/program/program";

export const MOCK_PROGRAM: ProgramCompletion = {
    completedCredit: 0,
    compulsoryCredit: 0,
    restrictedCredit: 0,
    electiveCredit: 0,
    duplicatedCourse: [],
    courseSet: [],
};

export const MOCK_FULL_PROGRAM: ProgramFull = {courseSet: []};
