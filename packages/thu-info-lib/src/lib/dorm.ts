import {roam, roamingWrapperWithMocks} from "./core";
import {
    ELE_PAY_RECORD_URL,
    RECHARGE_ELE_URL,
    RECHARGE_PAY_ELE_URL,
    ELE_REMAINDER_URL,
    DORM_SCORE_URL,
    WEB_VPN_ROOT_URL,
} from "../constants/strings";
import cheerio from "cheerio";
import {generalGetPayCode} from "../utils/alipay";
import {getCheerioText} from "../utils/cheerio";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {MOCK_ELE_PAY_RECORD, MOCK_ELE_REMAINDER} from "../mocks/dorm";
import {EleError} from "../utils/error";
type Cheerio = ReturnType<typeof cheerio>;
type Element = Cheerio[number];
type TagElement = Element & {type: "tag"};

export const getDormScore = (helper: InfoHelper): Promise<string> =>
    roamingWrapperWithMocks(
        helper,
        "myhome_mobile",
        "",
        () => uFetch(DORM_SCORE_URL).then(
            (s) => WEB_VPN_ROOT_URL + cheerio("#weixin_health_linechartCtrl1_Chart1", s).attr().src,
        ),
        "",
    );

export const getEleRechargePayCode = async (
    helper: InfoHelper,
    money: number,
): Promise<string> => {
    await roam(helper, "myhome", "");

    const $ = await uFetch(RECHARGE_ELE_URL).then(cheerio.load);

    const redirect = await uFetch(RECHARGE_PAY_ELE_URL, {
        __EVENTTARGET: "",
        __EVENTARGUMENT: "",
        __VIEWSTATE: $("#__VIEWSTATE").attr().value,
        __VIEWSTATEGENERATOR: $("#__VIEWSTATEGENERATOR").attr().value,
        recharge_eleCtrl1$RadioButtonList1: "支付宝支付",
        write_money: money,
        username: $("input[name=username]").attr().value,
        louhao: $("input[name=louhao]").attr().value,
        room: $("input[name=room]").attr().value,
        student_id: $("input[name=student_id]").attr().value,
        banktype: "alipay",
    }, 60000, "GBK").then((s) => cheerio("#banksubmit", s));

    return await generalGetPayCode(await uFetch(redirect.attr().action, redirect.serialize() as never as object, 60000, "UTF-8", true), "GBK");
};

export const getElePayRecord = async (
    helper: InfoHelper,
): Promise<[string, string, string, string, string, string][]> =>
    roamingWrapperWithMocks(
        helper,
        "myhome",
        "",
        async () => {
            const data = (await uFetch(ELE_PAY_RECORD_URL).then(cheerio.load))(".myTable tr");
            if (data.length === 0) throw new EleError();

            return data.slice(1, data.length - 1)
                .map((index, element) => [
                    (element as TagElement).children
                        .filter((it) => it.type === "tag" && it.tagName === "td")
                        .map((it) => getCheerioText(it, 1)),
                ])
                .get();
        },
        MOCK_ELE_PAY_RECORD,
    );

export const getEleRemainder = async (
    helper: InfoHelper,
): Promise<number> =>
    roamingWrapperWithMocks(
        helper,
        "myhome",
        "",
        async () => {
            const $ = await uFetch(ELE_REMAINDER_URL).then(cheerio.load);
            if ($("#net_Default_LoginCtrl1_txtUserName").length === 1) throw new EleError();
            return Number($("#Netweb_Home_electricity_DetailCtrl1_lblele").text().trim());
        },
        MOCK_ELE_REMAINDER,
    );
