import {roamingWrapperWithMocks} from "./core";
import {
    JXMH_URL,
    JXRL_BKS_PREFIX,
    JXRL_BKS_URL,
    JXRL_MIDDLE,
    JXRL_SUFFIX,
    JXRL_YJS_PREFIX,
    JXRL_YJS_URL,
    SECONDARY_URL,
} from "../constants/strings";
import {mergeSchedules, parseJSON, parseScript, Schedule, ScheduleType} from "../models/schedule/schedule";
import {Semester} from "../models/schedule/calendar";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {MOCK_PRIMARY_SCHEDULE, MOCK_SECONDARY_SCHEDULE} from "../mocks/schedule";
import {ScheduleError} from "../utils/error";
import {getCalendar} from "./basics";
import dayjs from "dayjs";
import * as cheerio from "cheerio";

const GROUP_SIZE = 3;

const getPrimary = (helper: InfoHelper, {firstDay, weekCount}: Semester) =>
    roamingWrapperWithMocks(
        helper,
        "default",
        helper.graduate() ? "BEABB32641DC4EC3510B048BAF42471A": "287C0C6D90ABB364CD5FDF1495199962",
        () => Promise.all(
            Array.from(new Array(Math.ceil(weekCount / GROUP_SIZE)), (_, id) =>
                uFetch(
                    (helper.graduate() ? JXRL_YJS_PREFIX : JXRL_BKS_PREFIX) +
                    dayjs(firstDay).add((id * GROUP_SIZE) * 7, "day").format("YYYYMMDD") +
                    JXRL_MIDDLE +
                    dayjs(firstDay).add(((id + 1) * GROUP_SIZE - 1) * 7 + 6, "day").format("YYYYMMDD") +
                    JXRL_SUFFIX,
                ),
            ),
        )
            .then((results) =>
                results
                    .map((s) => {
                        if (s[0] !== "m") {
                            throw new ScheduleError();
                        }
                        return s.substring(s.indexOf("[") + 1, s.lastIndexOf("]"));
                    })
                    .filter((s) => s.trim().length > 0)
                    .join(","),
            )
            .then((str) => parseJSON(JSON.parse(`[${str}]`))),
        MOCK_PRIMARY_SCHEDULE,
    );

const getSecondary = (helper: InfoHelper, {firstDay}: Semester) =>
    roamingWrapperWithMocks(
        helper,
        "default",
        helper.graduate() ? "BEABB32641DC4EC3510B048BAF42471A": "287C0C6D90ABB364CD5FDF1495199962",
        () => uFetch(SECONDARY_URL).then((str) => {
            const lowerBound = str.indexOf("function setInitValue");
            const upperBound = str.indexOf("}", lowerBound);
            return parseScript(
                str.substring(lowerBound, upperBound),
                firstDay,
            ) as Schedule[];
        }),
        MOCK_SECONDARY_SCHEDULE,
    );

export const getSchedule = async (helper: InfoHelper, nextSemesterIndex: number | undefined) => {
    const calendarData = await getCalendar(helper);
    const semester = nextSemesterIndex === undefined || nextSemesterIndex >= calendarData.nextSemesterList.length ? calendarData : calendarData.nextSemesterList[nextSemesterIndex];
    const scheduleList: Schedule[] = (await getPrimary(helper, semester)).concat(helper.graduate() ? [] : await getSecondary(helper, semester));
    return {
        schedule: mergeSchedules(scheduleList),
        calendar: calendarData,
    };
};

export const saveCustomSchedule = async (helper: InfoHelper, schedules: Schedule[]) =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "",
        async () => {
            const $ = cheerio.load(await uFetch(helper.graduate() ? JXRL_YJS_URL : JXRL_BKS_URL));
            let form = $("form[action=\"jxmh.do\"]");
            if (form.length === 0) {
                throw new Error();
            }
            for (const schedule of schedules) {
                if (schedule.type !== ScheduleType.CUSTOM) {
                    continue;
                }
                const zt = schedule.name.substring(6);
                const dd = schedule.location;
                for (const time of schedule.activeTime.base) {
                    const role = form.find("input[name=\"role\"]").attr("value");
                    const token = form.find("input[name=\"token\"]").attr("value");
                    const p_date = time.beginTime.format("YYYYMMDD");
                    const p_start_time = time.beginTime.format("HH:mm");
                    const p_end_time = time.endTime.format("HH:mm");
                    if (!token) {
                        return;
                    }
                    const result = await uFetch(JXMH_URL, {
                        m: "saveGrrl",
                        role,
                        grrlID: "",
                        displayType: "",
                        token,
                        zt,
                        dd,
                        p_date,
                        p_start_time,
                        p_end_time,
                    }, 60000, "GBK");
                    form = cheerio.load(result)("form[action=\"jxmh.do\"]");
                    if (form.length === 0) {
                        return;
                    }
                }
            }
        },
        undefined,
    );

export const deleteCustomSchedule = async (helper: InfoHelper, schedules: Schedule[]) =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "",
        async () => {
            const $ = cheerio.load(await uFetch(helper.graduate() ? JXRL_YJS_URL : JXRL_BKS_URL));
            let form = $("form[action=\"jxmh.do\"]");
            if (form.length === 0) {
                throw new Error();
            }
            for (const schedule of schedules) {
                if (schedule.type !== ScheduleType.PRIMARY || schedule.category !== "个人日历") {
                    continue;
                }
                const zt = schedule.name;
                const dd = schedule.location;
                for (const time of schedule.activeTime.base) {
                    const role = form.find("input[name=\"role\"]").attr("value");
                    const token = form.find("input[name=\"token\"]").attr("value");
                    if (!token) {
                        return;
                    }
                    const grrlID = time.id;
                    if (!grrlID) {
                        return;
                    }
                    const result = await uFetch(JXMH_URL, {
                        m: "deleteGrrl",
                        role,
                        grrlID,
                        displayType: "",
                        token,
                        zt,
                        dd,
                    }, 60000, "GBK");
                    form = cheerio.load(result)("form[action=\"jxmh.do\"]");
                    if (form.length === 0) {
                        return;
                    }
                }
            }
        },
        undefined,
    );
