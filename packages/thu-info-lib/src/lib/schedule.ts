import {roamingWrapperWithMocks} from "./core";
import {
    JXRL_MIDDLE,
    JXRL_BKS_PREFIX,
    JXRL_SUFFIX,
    SECONDARY_URL,
    JXRL_YJS_PREFIX,
} from "../constants/strings";
import {
    Schedule,
    mergeSchedules,
    mergeTimeBlocks,
    parseJSON,
    parseScript,
} from "../models/schedule/schedule";
import {Calendar} from "../models/schedule/calendar";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {
    MOCK_PRIMARY_SCHEDULE,
    MOCK_SECONDARY_SCHEDULE,
} from "../mocks/schedule";

const GROUP_SIZE = 3; // Make sure that `GROUP_SIZE` is a divisor of `Calendar.weekCount`.

const getPrimary = (helper: InfoHelper) =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "287C0C6D90ABB364CD5FDF1495199962",
        () => Promise.all(
            Array.from(new Array(Calendar.weekCount / GROUP_SIZE), (_, id) =>
                uFetch(
                    (helper.graduate() ? JXRL_YJS_PREFIX : JXRL_BKS_PREFIX) +
                    new Calendar(id * GROUP_SIZE + 1, 1).date.format("YYYYMMDD") +
                    JXRL_MIDDLE +
                    new Calendar((id + 1) * GROUP_SIZE, 7).date.format("YYYYMMDD") +
                    JXRL_SUFFIX,
                ),
            ),
        )
            .then((results) =>
                results
                    .map((s) => {
                        if (s[0] !== "m") {
                            throw 0;
                        }
                        return s.substring(s.indexOf("[") + 1, s.lastIndexOf("]"));
                    })
                    .filter((s) => s.trim().length > 0)
                    .join(","),
            )
            .then((str) => JSON.parse(`[${str}]`))
            .then(parseJSON),
        MOCK_PRIMARY_SCHEDULE,
    );

const getSecondary = (helper: InfoHelper) =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "287C0C6D90ABB364CD5FDF1495199962",
        () => uFetch(SECONDARY_URL).then((str) => {
            const lowerBound = str.indexOf("function setInitValue");
            const upperBound = str.indexOf("}", lowerBound);
            return parseScript(
                str.substring(lowerBound, upperBound),
            ) as Schedule[];
        }),
        MOCK_SECONDARY_SCHEDULE,
    );

export const getSchedule = async (helper: InfoHelper) => {
    let scheduleList: Schedule[] = (await getPrimary(helper)).concat(await getSecondary(helper));
    scheduleList = mergeSchedules(scheduleList);
    scheduleList.forEach(mergeTimeBlocks);
    return scheduleList;
};
