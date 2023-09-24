import {roamingWrapperWithMocks} from "./core";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {THOS_SELECT_ONE_URL} from "../constants/strings";
import {LibError} from "../utils/error";
import {CourseScore} from "../models/home/thos";
import {MOCK_COURSE_SCORE} from "../mocks/thos";

export const getScoreByCourseId = (helper: InfoHelper, courseId: string): Promise<CourseScore> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "56B13DDF68BB3DEA13D98E1E3E776D3E",
        async () => {
            const result = await uFetch(THOS_SELECT_ONE_URL, JSON.stringify({
                presetKey:"103765749452800",
                param: {XH: helper.userId, KCH: courseId},
            }) as never, 60000, "UTF-8", true, "application/json");
            if (result.includes("您即将登录") || result.includes("清华大学WebVPN")) {
                throw new LibError();
            }
            const o = JSON.parse(result);
            return {
                name: o.KCMC,
                credit: o.XF,
                grade: o.DJZCJ,
            };
        },
        MOCK_COURSE_SCORE,
    );
