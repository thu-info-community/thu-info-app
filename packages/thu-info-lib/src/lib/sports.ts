import {retryWrapperWithMocks} from "./core";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {SPORTS_DETAIL_URL} from "../constants/strings";
import {SportsResource} from "../models/home/sports";

export const getSportsResources = async (
    helper: InfoHelper,
    date: string, // yyyy-MM-dd
) =>
    retryWrapperWithMocks(
        helper,
        50,
        async () => {
            const rawHtml = await uFetch(SPORTS_DETAIL_URL + date);
            const result: { [key: string]: SportsResource } = {};

            // Step one: get total resources
            const p1 = /resourceArray.push\({id:'(.*?)',time_session:'(.*?)',field_name:'(.*?)',overlaySize:'(.*?)',can_net_book:'(.*?)'}\);/g;
            for (let r1 = p1.exec(rawHtml); r1 != null; r1 = p1.exec(rawHtml)) {
                result[r1[1]] = {
                    resId: r1[1],
                    timeSession: r1[2],
                    fieldName: r1[3],
                    overlaySize: Number(r1[4]),
                    canNetBook: r1[5] === "1",
                } as SportsResource;
            }

            // Step two: update cost
            const p2 = /addCost\('(.*?)','(.*?)'\);/g;
            for (let r2 = p2.exec(rawHtml); r2 != null; r2 = p2.exec(rawHtml)) {
                if (result[r2[1]] !== undefined) {
                    result[r2[1]].cost = Number(r2[2]);
                }
            }

            // Step three: mark res status
            const p3 = /markResStatus\('(.*?)','(.*?)','(.*?)'\);/g;
            for (let r3 = p3.exec(rawHtml); r3 != null; r3 = p3.exec(rawHtml)) {
                if (result[r3[2]] !== undefined) {
                    result[r3[2]].bookId = r3[1];
                    result[r3[2]].locked = r3[3] === "1";
                }
            }

            // Step four: mark status color
            const p4 = /markStatusColor\('(.*?)','(.*?)','(.*?)','(.*?)'\);/g;
            for (let r4 = p4.exec(rawHtml); r4 != null; r4 = p4.exec(rawHtml)) {
                if (result[r4[1]] !== undefined) {
                    result[r4[1]].userType = r4[2];
                    result[r4[1]].paymentStatus = r4[3] === "1";
                }
            }

            return Object.keys(result).map(key => result[key]);
        },
        undefined,
    );
