import {retryWrapperWithMocks} from "./core";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {SPORTS_DETAIL_URL} from "../constants/strings";

export const getSportsAvailableTime = async (
    helper: InfoHelper,
    date: string, // yyyy-MM-dd
) =>
    retryWrapperWithMocks(
        helper,
        50,
        async () => {
            await uFetch(SPORTS_DETAIL_URL + date).then(console.error);
        },
        undefined,
    );
