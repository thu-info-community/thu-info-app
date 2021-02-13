import {retryWrapper} from "./core";
import {
    WEB_VPN_ROOT_URL,
    DORM_SCORE_REFERER,
    DORM_SCORE_URL,
    ELE_PAY_RECORD_URL,
    RECHARGE_ELE_REFERER,
    RECHARGE_ELE_URL,
    DORM_LOGIN_VIEWSTATE,
    RECHARGE_PAY_ELE_URL,
    TSINGHUA_HOME_LOGIN_URL,
} from "../constants/strings";
import cheerio from "cheerio";
import {generalGetPayCode} from "../utils/generalAlipay";
import {getCheerioText} from "../utils/cheerio";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
type Cheerio = ReturnType<typeof cheerio>;
type Element = Cheerio[number];
type TagElement = Element & {type: "tag"};

const loginToHome = async (helper: InfoHelper) => {
    const validChars = new Set(
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz =+-/_()<>,.'`~",
    );
    // TODO: these valid chars might be far from enough
    const {userId} = helper;
    const password = helper.dormPassword || helper.password;
    let tempPassword = "";
    for (let i = 0; i < password.length; i++) {
        if (validChars.has(password.charAt(i))) {
            tempPassword += password.charAt(i);
        }
    }
    await uFetch(
        TSINGHUA_HOME_LOGIN_URL,
        undefined,
        {
            __VIEWSTATE: DORM_LOGIN_VIEWSTATE,
            __VIEWSTATEGENERATOR: "CA0B0334",
            net_Default_LoginCtrl1$txtUserName: userId,
            net_Default_LoginCtrl1$txtUserPwd: tempPassword,
            "net_Default_LoginCtrl1$lbtnLogin.x": 17,
            "net_Default_LoginCtrl1$lbtnLogin.y": 10,
            net_Default_LoginCtrl1$txtSearch1: "",
            Home_Img_NewsCtrl1$hfJsImg: "dummyContent",
            Home_Img_ActivityCtrl1$hfScript: "dummyContent",
            Home_Vote_InfoCtrl1$Repeater1$ctl01$hfID: 52,
            Home_Vote_InfoCtrl1$Repeater1$ctl01$rdolstSelect: 221,
        },
    );
};

export const getDormScore = (helper: InfoHelper): Promise<string> =>
    retryWrapper(
        helper,
        -1,
        uFetch(DORM_SCORE_URL, DORM_SCORE_REFERER).then(
            (s) => WEB_VPN_ROOT_URL + cheerio("#weixin_health_linechartCtrl1_Chart1", s).attr().src,
        ),
    );

export const getEleRechargePayCode = async (
    helper: InfoHelper,
    money: number,
): Promise<string> => {
    await loginToHome(helper);

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
            write_money: String(money),
            username,
            louhao,
            banktype: "alipay",
        },
    ).then((s) => cheerio("#banksubmit", s).attr().action);

    return generalGetPayCode(redirect, RECHARGE_PAY_ELE_URL);
};

export const getElePayRecord = async (
    helper: InfoHelper,
): Promise<[string, string, string, string, string, string][]> => {
    if (helper.mocked()) {
        return [
            ["", "0", "2020-09-15 11:24:07", "", "10.00", "已成功"],
            ["", "1", "2020-09-06 17:38:57", "", "5.00", "已成功"],
            ["", "2", "2020-09-03 15:47:29", "", "20.00", "已成功"],
            ["", "3", "2020-08-30 09:17:38", "", "1.00", "已成功"],
            ["", "4", "2020-08-30 09:14:36", "", "4.00", "已成功"],
            ["", "5", "2020-08-24 11:43:00", "", "10.00", "已成功"],
            ["", "6", "2020-08-22 23:12:49", "", "5.00", "已成功"],
        ];
    }
    await loginToHome(helper);
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
};
