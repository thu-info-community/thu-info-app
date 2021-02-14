import {getTicket, retryWrapperWithMocks} from "./core";
import {
    WEB_VPN_ROOT_URL,
    DORM_SCORE_REFERER,
    DORM_SCORE_URL,
    ELE_PAY_RECORD_URL,
    RECHARGE_ELE_REFERER,
    RECHARGE_ELE_URL,
    RECHARGE_PAY_ELE_URL,
} from "../constants/strings";
import cheerio from "cheerio";
import {generalGetPayCode} from "../utils/generalAlipay";
import {getCheerioText} from "../utils/cheerio";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {MOCK_ELE_PAY_RECORD} from "../mocks/dorm";
type Cheerio = ReturnType<typeof cheerio>;
type Element = Cheerio[number];
type TagElement = Element & {type: "tag"};

export const getDormScore = (helper: InfoHelper): Promise<string> =>
    retryWrapperWithMocks(
        helper,
        -1,
        uFetch(DORM_SCORE_URL, DORM_SCORE_REFERER).then(
            (s) => WEB_VPN_ROOT_URL + cheerio("#weixin_health_linechartCtrl1_Chart1", s).attr().src,
        ),
        "",
    );

export const getEleRechargePayCode = async (
    helper: InfoHelper,
    money: number,
): Promise<string> => {
    await getTicket(helper, -2);

    const $ = await uFetch(RECHARGE_ELE_URL, RECHARGE_ELE_REFERER).then(cheerio.load);

    const username = $("input[name=username]").attr().value;
    const louhao = $("input[name=louhao]").attr().value;

    const redirect = await uFetch(
        RECHARGE_PAY_ELE_URL,
        RECHARGE_ELE_URL,
        {
            __EVENTTARGET: "",
            __EVENTARGUMENT: "",
            __VIEWSTATE: "dummyContent",
            __VIEWSTATEGENERATOR: "D6B25EB7",
            recharge_eleCtrl1$RadioButtonList1: "支付宝支付",
            write_money: money,
            username,
            louhao,
            banktype: "alipay",
        },
    ).then((s) => cheerio("#banksubmit", s).attr().action);

    return generalGetPayCode(redirect, RECHARGE_PAY_ELE_URL);
};

export const getElePayRecord = async (
    helper: InfoHelper,
): Promise<[string, string, string, string, string, string][]> =>
    retryWrapperWithMocks(
        helper,
        -2,
        (async () => {
            const $ = await uFetch(ELE_PAY_RECORD_URL, RECHARGE_ELE_URL).then(cheerio.load);

            return $(".myTable")
                .first()
                .children()
                .slice(1)
                .map((index, element) => [
                    (element as TagElement).children
                        .filter((it) => it.type === "tag" && it.tagName === "td")
                        .map((it) => getCheerioText(it, 1)),
                ])
                .get();
        })(),
        MOCK_ELE_PAY_RECORD,
    );
