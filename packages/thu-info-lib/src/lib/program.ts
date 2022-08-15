import cheerio from "cheerio";
import {PROGRAM_URL} from "../constants/strings";
import {InfoHelper} from "../index";
import {CourseItem, CourseSet, CourseState, CourseType, Program} from "../models/program/program";
import {getTrimmedData} from "../utils/cheerio";
import {LibError} from "../utils/error";
import {uFetch} from "../utils/network";
import {roamingWrapperWithMocks} from "./core";

export const getDegreeProgram = async (helper: InfoHelper) =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "287C0C6D90ABB364CD5FDF1495199962",
        () => uFetch(PROGRAM_URL).then((str) => {
            const program: Program = {
                completedCredit: 0,
                compulsoryCredit: 0,
                restrictedCredit: 0,
                electiveCredit: 0,
                duplicatedCourse: [],
                courseSet: []
            };

            const getSubstr = (base: string, prefix: string, suffix: string): string => {
                const lowerBound = base.indexOf(prefix);
                const upperBound = base.indexOf(suffix, lowerBound);
                return base.substring(lowerBound + prefix.length, upperBound);
            };

            // Parse basic info
            const basicInfoStr = getSubstr(str, "<b>方案内实际完成", "学分只计一次");
            program.completedCredit = parseInt(
                getSubstr(basicInfoStr, "总学分：", "</b>"), 10
            );
            program.compulsoryCredit = parseInt(
                getSubstr(basicInfoStr, "其中必修完成总学分：<strong>", "</strong>"), 10
            );
            program.restrictedCredit = parseInt(
                getSubstr(basicInfoStr, "限选完成总学分：<strong>", "</strong>"), 10
            );
            program.electiveCredit = parseInt(
                getSubstr(basicInfoStr, "任选（方案内）完成总学分：<strong>", "</strong>"), 10
            );
            program.duplicatedCourse =
                getSubstr(basicInfoStr, "重复课程：", "属于多个课组")
                    .replace(/[\t{&#034;}]/g, "")
                    .split("、");

            const mayFailParseInt = (x: string): number | undefined => {
                if (x === "") {
                    return undefined;
                } else {
                    return parseInt(x, 10);
                }
            };

            // Use cheerio to parse courses
            let courseTypeNow = -1;
            let courseSetNameNow = "";
            cheerio(".table-striped tr", str)
                .slice(1) // 跳过表头
                .each((index, element) => {
                    if (element.type === "tag") {
                        if (element.children.length === 25) { // 每个课程属性部分的第一个课程
                            // 设置课程属性以及课组名称
                            courseTypeNow += 1;
                            courseSetNameNow = getTrimmedData(element, [1, 1, 1, 2]);

                            // TODO: 下述分支并未验证过
                            if (courseSetNameNow === "") { // 未修完的课组会显示红名，导致标签层次不同
                                courseSetNameNow = getTrimmedData(element, [1, 1, 1, 1, 1]);
                            }

                            const courseSet: CourseSet = {
                                setName: courseSetNameNow,
                                type: courseTypeNow as CourseType,
                                course: [], // 稍后填充
                                requiredCredit: mayFailParseInt(getTrimmedData(element, [7, 1, 0])),
                                completedCredit: mayFailParseInt(getTrimmedData(element, [8, 1, 0])),
                                requiredCourseNum: mayFailParseInt(getTrimmedData(element, [9, 1, 0])),
                                completedCourseNum: mayFailParseInt(getTrimmedData(element, [10, 1, 0])),
                                fullCompleted: getTrimmedData(element, [11, 1, 1, 0]) === "是",
                            };

                            let courseName = getTrimmedData(element, [3, 1, 0]);

                            // TODO: 下述分支并未验证过
                            if (courseName === "") { // 未修完的课程会显示蓝名，导致标签层次不同
                                courseName = getTrimmedData(element, [3, 1, 1, 0]);
                            }

                            if (courseName.length > 0) { // 当前课组有课程
                                const gradeOrState = getTrimmedData(element, [5, 1, 0]);

                                let state = CourseState.COMPLETED;
                                if (gradeOrState === "未修") {
                                    state = CourseState.NON_ELECTED;
                                } else if (gradeOrState === "选课") {
                                    state = CourseState.ELECTED;
                                }

                                const course: CourseItem = {
                                    id: parseInt(getTrimmedData(element, [2, 1, 0]), 10),
                                    name: courseName,
                                    credit: parseInt(getTrimmedData(element, [4, 1, 0]), 10),
                                    point: parseFloat(getTrimmedData(element, [6, 0])),
                                    grade: state === CourseState.COMPLETED ? gradeOrState : "N/A",
                                    state: state,
                                };

                                courseSet.course.push(course);
                            }

                            program.courseSet.push(courseSet);

                        } else if (element.children.length === 23) { // 每个课组的第一个课程
                            courseSetNameNow = getTrimmedData(element, [0, 1, 1, 2]);
                            if (courseSetNameNow === "") { // 未修完的课组会显示红名，导致标签层次不同
                                courseSetNameNow = getTrimmedData(element, [0, 1, 1, 1, 1]);
                            }

                            const courseSet: CourseSet = {
                                setName: courseSetNameNow,
                                type: courseTypeNow as CourseType,
                                course: [], // 稍后填充
                                requiredCredit: mayFailParseInt(getTrimmedData(element, [6, 1, 0])),
                                completedCredit: mayFailParseInt(getTrimmedData(element, [7, 1, 0])),
                                requiredCourseNum: mayFailParseInt(getTrimmedData(element, [8, 1, 0])),
                                completedCourseNum: mayFailParseInt(getTrimmedData(element, [9, 1, 0])),
                                fullCompleted: getTrimmedData(element, [10, 1, 1, 0]) === "是",
                            };

                            let courseName = getTrimmedData(element, [2, 1, 0]);
                            if (courseName === "") { // 未修完的课程会显示蓝名，导致标签层次不同
                                courseName = getTrimmedData(element, [2, 1, 1, 0]);
                            }

                            if (courseName.length > 0) { // 当前课组有课程
                                const gradeOrState = getTrimmedData(element, [4, 1, 0]);

                                let state = CourseState.COMPLETED;
                                if (gradeOrState === "未修") {
                                    state = CourseState.NON_ELECTED;
                                } else if (gradeOrState === "选课") {
                                    state = CourseState.ELECTED;
                                }

                                const course: CourseItem = {
                                    id: parseInt(getTrimmedData(element, [1, 1, 0]), 10),
                                    name: courseName,
                                    credit: parseInt(getTrimmedData(element, [3, 1, 0]), 10),
                                    point: parseFloat(getTrimmedData(element, [5, 0])),
                                    grade: state === CourseState.COMPLETED ? gradeOrState : "N/A",
                                    state: state,
                                };

                                courseSet.course.push(course);
                            }

                            program.courseSet.push(courseSet);
                            
                        } else if (element.children.length === 21) { // 培养方案外课程
                            const idStr = getTrimmedData(element, [0, 0, 0]);
                            if (idStr.length > 0) {
                                const course: CourseItem = {
                                    id: parseInt(idStr, 10),
                                    name: getTrimmedData(element, [2, 0, 0]),
                                    credit: parseInt(getTrimmedData(element, [3, 0, 0]), 10),
                                    point: parseFloat(getTrimmedData(element, [6, 0, 0])),
                                    grade: getTrimmedData(element, [5, 1, 0]),
                                    state: CourseState.COMPLETED,
                                };

                                program.courseSet[program.courseSet.length - 1].course.push(course);
                            } else {
                                const courseSet: CourseSet = {
                                    setName: "方案外课程",
                                    type: CourseType.EXCLUDED,
                                    course: [], // 稍后填充
                                    fullCompleted: false,
                                };

                                program.courseSet.push(courseSet);
                            }

                        } else if (element.children.length === 11) { // 其余课程
                            let courseName = getTrimmedData(element, [1, 1, 0]);
                            if (courseName === "") { // 未修完的课程会显示蓝名，导致标签层次不同
                                courseName = getTrimmedData(element, [1, 1, 1, 0]);
                            }

                            const gradeOrState = getTrimmedData(element, [3, 1, 0]);

                            let state = CourseState.COMPLETED;
                            if (gradeOrState === "未修") {
                                state = CourseState.NON_ELECTED;
                            } else if (gradeOrState === "选课") {
                                state = CourseState.ELECTED;
                            }

                            const course: CourseItem = {
                                id: parseInt(getTrimmedData(element, [0, 1, 0]), 10),
                                name: courseName,
                                credit: parseInt(getTrimmedData(element, [2, 1, 0]), 10),
                                point: parseFloat(getTrimmedData(element, [4, 0])),
                                grade: state === CourseState.COMPLETED ? gradeOrState : "N/A",
                                state: state,
                            };

                            program.courseSet[program.courseSet.length - 1].course.push(course);

                        } else {
                            throw new LibError();
                        }
                    }
                });

            return program;
        }),
        {
            completedCredit: 0,
            compulsoryCredit: 0,
            restrictedCredit: 0,
            electiveCredit: 0,
            duplicatedCourse: [],
            courseSet: []
        }, // TODO: Mock!
    );