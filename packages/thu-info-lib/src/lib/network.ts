import {InfoHelper} from "../index";
import {getCsrfToken, roamingWrapperWithMocks} from "./core";
import {getRedirectUrl, uFetch} from "../utils/network";
import cheerio from "cheerio";
import {Detial} from "../models/network/detial";
import {LibError} from "../utils/error";
import {NETWORK_DETAIL_URL} from "../constants/strings";

export const getNetworkDetail = async (helper: InfoHelper, year: number, month: number): Promise<Detial> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "66D157166A3E5EEB3C558B66803B2929",
        async () => {
            const resp = await uFetch(NETWORK_DETAIL_URL + `&year=${year}&month=${month}`);
            if (resp === "请登录先")
                throw new LibError();
            const $ = cheerio.load(resp);
            const tr = $(".maintab table:eq(2) tbody tr:eq(1)").children();
            return {
                year: year,
                month: month,
                wiredUsage: {
                    in: tr.eq(1).text(),
                    out: tr.eq(2).text(),
                    total: tr.eq(3).text(),
                    onlineTime: tr.eq(4).text(),
                    loginCount: tr.eq(5).text(),
                    currentCost: tr.eq(6).text(),
                },
                wirelessUsage: {
                    in: tr.eq(7).text(),
                    out: tr.eq(8).text(),
                    total: tr.eq(9).text(),
                    onlineTime: tr.eq(10).text(),
                    loginCount: tr.eq(11).text(),
                    currentCost: tr.eq(12).text(),
                },
                monthlyCost: tr.eq(13).text()
            };
        },
        {
            month: 4,
            year: 2023,
            wiredUsage: {
                in: "0B",
                out: "0B",
                total: "0B",
                onlineTime: "0秒",
                loginCount: "0",
                currentCost: "0.00"
            },
            wirelessUsage: {
                in: "404.06M",
                out: "5.40G",
                total: "5.80G",
                onlineTime: "14小时6分25秒",
                loginCount: "6",
                currentCost: "0.00"
            },
            monthlyCost: "0"
        }
    );