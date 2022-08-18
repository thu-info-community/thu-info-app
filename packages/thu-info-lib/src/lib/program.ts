import cheerio from "cheerio";
import {PROGRAM_URL} from "../constants/strings";
import {InfoHelper} from "../index";
import {CourseItem, CourseSet, CourseState, CourseType, Program} from "../models/program/program";
import {getTrimmedData} from "../utils/cheerio";
import {ProgramError} from "../utils/error";
import {uFetch} from "../utils/network";
import {systemMessage} from "./basics";
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

            if (str.includes(systemMessage)) { // 强制重新登陆
                throw new ProgramError(systemMessage);
            }

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

            const mayFailParseFloat = (x: string): number | undefined => {
                const f = parseFloat(x);
                if (Number.isNaN(f)) {
                    return undefined;
                } else {
                    return f;
                }
            };

            /**
             * level 表示该课程在表格中的层级
             * 每个课程属性部分的第一个课程 - 2
             * 每个课组的第一个课程 - 1
             * 其余课程 - 0
             */
            const parseCourse = (element: any, level: 2 | 1 | 0): CourseItem | undefined => {
                let courseName = getTrimmedData(element, [level + 1, 1, 0]);
                if (courseName === "") { // 未修完的课程会显示蓝名，导致标签层次不同
                    courseName = getTrimmedData(element, [level + 1, 1, 1, 0]);
                }
                if (courseName === "") { // 两次尝试均未获取合法课程名称
                    return undefined;
                }

                const gradeOrState = getTrimmedData(element, [level + 3, 1, 0]);

                let state = CourseState.COMPLETED;
                let grade: string | undefined = gradeOrState;
                if (gradeOrState === "未修") {
                    state = CourseState.NOT_ELECTED;
                    grade = undefined;
                } else if (gradeOrState === "选课") {
                    state = CourseState.ELECTED;
                    grade = undefined;
                } else if (gradeOrState === "W") {
                    state = CourseState.NOT_ELECTED;
                    grade = "W";
                }

                const course: CourseItem = {
                    id: parseInt(getTrimmedData(element, [level, 1, 0]), 10),
                    name: courseName,
                    credit: parseInt(getTrimmedData(element, [level + 2, 1, 0]), 10),
                    point: mayFailParseFloat(getTrimmedData(element, [level + 4, 0])),
                    grade: grade,
                    state: state,
                };

                return course;
            };

            /**
             * level 表示该课程在表格中的层级
             * 每个课程属性部分的第一个课程 - 1
             * 每个课组的第一个课程 - 0
             */
            const parseCourseSet = (element: any, level: 1 | 0): CourseSet => {
                let name = getTrimmedData(element, [level, 1, 1, 2]);
                if (name === "") { // 未修完的课组会显示红名，导致标签层次不同
                    name = getTrimmedData(element, [level, 1, 1, 1, 1]);
                }

                const courseSet: CourseSet = {
                    setName: name,
                    type: courseTypeNow as CourseType,
                    course: [], // 稍后填充
                    requiredCredit: mayFailParseInt(getTrimmedData(element, [level + 6, 1, 0])),
                    completedCredit: mayFailParseInt(getTrimmedData(element, [level + 7, 1, 0])),
                    requiredCourseNum: mayFailParseInt(getTrimmedData(element, [level + 8, 1, 0])),
                    completedCourseNum: mayFailParseInt(getTrimmedData(element, [level + 9, 1, 0])),
                    fullCompleted: getTrimmedData(element, [level + 10, 1, 1, 0]) === "是",
                };

                return courseSet;
            };

            let courseTypeNow = -1;
            let illegalCourseLevelFlag = false;

            cheerio(".table-striped tr", str)
                .slice(1) // 跳过表头
                .each((index, element) => {
                    if (element.type === "tag") {
                        if (element.children.length === 25) { // 每个课程属性部分的第一个课程
                            courseTypeNow += 1; // 递增课程属性
                            
                            const courseSet = parseCourseSet(element, 1);
                            const course = parseCourse(element, 2);
                            if (course !== undefined) {
                                courseSet.course.push(course);
                            }
                            program.courseSet.push(courseSet);

                        } else if (element.children.length === 23) { // 每个课组的第一个课程
                            const courseSet = parseCourseSet(element, 0);
                            const course = parseCourse(element, 1);
                            if (course !== undefined) {
                                courseSet.course.push(course);
                            }
                            program.courseSet.push(courseSet);
                            
                        } else if (element.children.length === 11) { // 其余课程
                            const course = parseCourse(element, 0);
                            if (course !== undefined) {
                                program.courseSet[program.courseSet.length - 1].course.push(course);
                            }

                        } else if (element.children.length === 21) { // 培养方案外课程
                            const idStr = getTrimmedData(element, [0, 0, 0]);
                            if (idStr.length > 0) {
                                const credit = parseInt(getTrimmedData(element, [3, 0, 0]), 10);
                                const grade = getTrimmedData(element, [5, 1, 0]);
                                const course: CourseItem = {
                                    id: parseInt(idStr, 10),
                                    name: getTrimmedData(element, [2, 0, 0]),
                                    credit: credit,
                                    point: mayFailParseFloat(getTrimmedData(element, [6, 0, 0])),
                                    grade: grade,
                                    state: CourseState.COMPLETED,
                                };

                                program.courseSet[program.courseSet.length - 1].course.push(course);
                                if (grade !== "W") {
                                    (program.courseSet[program.courseSet.length - 1].completedCredit as number)
                                        += credit;
                                }
                            } else {
                                const courseSet: CourseSet = {
                                    setName: "方案外课程",
                                    type: CourseType.EXCLUDED,
                                    course: [], // 稍后填充
                                    completedCredit: 0, // 稍后计算
                                    fullCompleted: false,
                                };

                                program.courseSet.push(courseSet);
                            }

                        } else {
                            illegalCourseLevelFlag = true;
                        }
                    }
                });

            if (illegalCourseLevelFlag) {
                throw new ProgramError("检测到未知层级课程");
            }
            
            console.log(JSON.stringify(program));
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