import {roam, roamingWrapperWithMocks} from "./core";
import {
    ELE_PAY_RECORD_URL,
    RECHARGE_ELE_URL,
    RECHARGE_PAY_ELE_URL,
    ELE_REMAINDER_URL,
    DORM_SCORE_URL,
    WEB_VPN_ROOT_URL,
    DORM_LOGIN_URL_PREFIX,
    CHANGE_HOME_PASSWORD_URL,
} from "../constants/strings";
import cheerio from "cheerio";
import {generalGetPayCode} from "../utils/alipay";
import {getCheerioText} from "../utils/cheerio";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {MOCK_DORM_SCORE_BASE64, MOCK_ELE_PAY_RECORD, MOCK_ELE_REMAINDER} from "../mocks/dorm";
import {DormAuthError, EleError} from "../utils/error";
type Cheerio = ReturnType<typeof cheerio>;
type Element = Cheerio[number];
type TagElement = Element & {type: "tag"};

export const getDormScore = (helper: InfoHelper, dormPassword: string): Promise<string> =>
    roamingWrapperWithMocks(
        helper,
        undefined,
        "",
        async () => {
            await uFetch(DORM_LOGIN_URL_PREFIX, {
                __VIEWSTATE: "/wEPDwUKLTEzNDQzMjMyOGRkBAc4N3HClJjnEWfrw0ASTb/U6Ev/SwndECOSr8NHmdI=",
                __VIEWSTATEGENERATOR: "7FA746C3",
                __EVENTVALIDATION: "/wEWBgK41bCLBQKPnvPTAwLXmu9LAvKJ/YcHAsSg1PwGArrUlUcttKZxxZPSNTWdfrBVquy6KRkUYY9npuyVR3kB+BCrnQ==",
                weixin_user_authenticateCtrl1$txtUserName: helper.userId,
                weixin_user_authenticateCtrl1$txtPassword: dormPassword,
                weixin_user_authenticateCtrl1$btnLogin: "登录",
            });
            const response = await uFetch(DORM_SCORE_URL);
            const chart = cheerio("#weixin_health_linechartCtrl1_Chart1", response);
            if (chart.length !== 1) {
                throw new DormAuthError();
            }
            const url = WEB_VPN_ROOT_URL + chart.attr().src;
            return await uFetch(url);
        },
        MOCK_DORM_SCORE_BASE64,
    );

export const getEleRechargePayCode = async (
    helper: InfoHelper,
    money: number,
): Promise<string> => {
    await roam(helper, "id", "051bb58cba58a1c5f67857606497387f");

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
        "id",
        "051bb58cba58a1c5f67857606497387f",
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
): Promise<{remainder: number; updateTime: string}> =>
    roamingWrapperWithMocks(
        helper,
        "id",
        "051bb58cba58a1c5f67857606497387f",
        async () => {
            const $ = await uFetch(ELE_REMAINDER_URL).then(cheerio.load);
            if ($("#net_Default_LoginCtrl1_txtUserName").length === 1) throw new EleError();
            const remainderText = $("#Netweb_Home_electricity_DetailCtrl1_lblele").text().trim();
            if (remainderText === "") throw new EleError();
            const remainder = Number(remainderText);
            const updateTime = $("#Netweb_Home_electricity_DetailCtrl1_lbltime").text().trim();
            return {remainder, updateTime};
        },
        MOCK_ELE_REMAINDER,
    );

export const resetDormPassword = async (
    helper: InfoHelper,
    newPassword: string,
): Promise<void> =>
    roamingWrapperWithMocks(
        helper,
        "id",
        "051bb58cba58a1c5f67857606497387f",
        async () => {
            const $ = await uFetch(CHANGE_HOME_PASSWORD_URL).then(cheerio.load);
            if ($("#ChangePasswordCtrl1_txtoldpassword").length === 0) {
                throw new DormAuthError();
            }
            const hiddenInputs = $("input[type=hidden]");
            const form: {[key: string]: string} = {};
            hiddenInputs.each((_, element) => {
                if (element.type === "tag") {
                    form[element.attribs.name] = element.attribs.value;
                }
            });
            form.__EVENTTARGET = "ChangePasswordCtrl1:btnOK";
            form.ChangePasswordCtrl1$txtoldpassword = "";
            form.ChangePasswordCtrl1$txtnewpassword = newPassword;
            form.ChangePasswordCtrl1$txtnewpassword1 = newPassword;
            await uFetch(CHANGE_HOME_PASSWORD_URL, form);
        },
        undefined,
    );
