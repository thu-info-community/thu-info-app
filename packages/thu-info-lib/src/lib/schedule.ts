import {retryWrapperWithMocks} from "./core";
import {
    INFO_ROOT_URL,
    JXMH_REFERER,
    JXRL_MIDDLE,
    JXRL_BKS_PREFIX,
    JXRL_SUFFIX,
    SECONDARY_URL,
    JXRL_YJS_PREFIX,
} from "../constants/strings";
import {
    Schedule,
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
    MOCK_SECONDARY_VERBOSE,
} from "../mocks/schedule";

const GROUP_SIZE = 3; // Make sure that `GROUP_SIZE` is a divisor of `Calendar.weekCount`.

const getPrimary = (helper: InfoHelper) =>
    retryWrapperWithMocks(
        helper,
        792,
        () => Promise.all(
            Array.from(new Array(Calendar.weekCount / GROUP_SIZE), (_, id) =>
                uFetch(
                    (helper.graduate() ? JXRL_YJS_PREFIX : JXRL_BKS_PREFIX) +
                    new Calendar(id * GROUP_SIZE + 1, 1).date.format("YYYYMMDD") +
                    JXRL_MIDDLE +
                    new Calendar((id + 1) * GROUP_SIZE, 7).date.format("YYYYMMDD") +
                    JXRL_SUFFIX,
                    INFO_ROOT_URL,
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
    retryWrapperWithMocks(
        helper,
        792,
        () => uFetch(SECONDARY_URL, JXMH_REFERER).then((str) => {
            const lowerBound = str.indexOf("function setInitValue");
            const upperBound = str.indexOf("}", lowerBound);
            return parseScript(
                str.substring(lowerBound, upperBound),
            ) as Schedule[];
        }),
        MOCK_SECONDARY_SCHEDULE,
    );

export const getSchedule = async (helper: InfoHelper) => {
    const scheduleList: Schedule[] = (await getPrimary(helper)).concat(await getSecondary(helper));
    scheduleList.forEach(mergeTimeBlocks);
    return scheduleList;
};

export const getSecondaryVerbose = (helper: InfoHelper) =>
    retryWrapperWithMocks(
        helper,
        792,
        () => uFetch(SECONDARY_URL, JXMH_REFERER).then((str) => {
            const lowerBound = str.indexOf("function setInitValue");
            const upperBound = str.indexOf("}", lowerBound);
            return parseScript(str.substring(lowerBound, upperBound), true) as [
                string,
                string,
                boolean,
            ][];
        }),
        MOCK_SECONDARY_VERBOSE,
    );
