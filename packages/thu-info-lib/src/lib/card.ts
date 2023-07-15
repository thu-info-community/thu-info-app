import {roam} from "./core";
import {InfoHelper} from "../index";
import {setCookie, uFetch} from "../utils/network";
import {
    CARD_CANCEL_LOSS_URL, CARD_CHANGE_PWD_URL,
    CARD_INFO_BY_USER_URL,
    CARD_LOGIN_URL, CARD_MOD_MAX_CONSUME_URL,
    CARD_PHOTO_URL, CARD_RECHARGE_FROM_BANK_URL, CARD_RECHARGE_FROM_WECHAT_ALIPAY_URL, CARD_REPORT_LOSS_URL,
    CARD_TRANSACTION_URL, CARD_USER_BY_TOKEN_URL,
    CONTENT_TYPE_JSON,
} from "../constants/strings";
import {CardInfo} from "../models/card/info";
import {CardTransaction, CardTransactionType} from "../models/card/transaction";

const accountBaseInfo = {
    user: "",
    cardId: "",
};

const fetchWithParse = async (url: string, jsonStruct: any = {}) => {
    const response = await uFetch(url, JSON.stringify(jsonStruct) as any, undefined, undefined, true, CONTENT_TYPE_JSON);
    const data = JSON.parse(response);
    if (data.success !== true) {
        throw new Error(data.message);
    }

    return data.resultData;
};

const assureLoginValid = async (helper: InfoHelper) => {
    try {
        if ((await fetchWithParse(CARD_USER_BY_TOKEN_URL)).loginuser !== accountBaseInfo.user) {
            await cardLogin(helper);
        }
    }
    catch {
        await cardLogin(helper);
    }
};

export const cardLogin = async (helper: InfoHelper): Promise<string> => {
    const redirectUrl = await roam(helper, "card", "eea30cbedcaf97c69d28b2d92f22a259");
    const ticket = new RegExp(/ticket=(\w*?)$/).exec(redirectUrl)![1];
    const token = (await fetchWithParse(CARD_LOGIN_URL, {ticket: ticket})).token;
    setCookie("token", token);
    accountBaseInfo.user = (await fetchWithParse(CARD_USER_BY_TOKEN_URL)).loginuser;
    return token;
};

export const cardGetInfo = async (helper: InfoHelper): Promise<CardInfo> => {
    await assureLoginValid(helper);

    const rawInfoStruct = await fetchWithParse(CARD_INFO_BY_USER_URL, {idserial: accountBaseInfo.user});

    const info: CardInfo = {
        userId: rawInfoStruct.idserial,
        userName: rawInfoStruct.username,
        userNameEn: rawInfoStruct.engname,
        departmentName: rawInfoStruct.departname,
        departmentNameEn: rawInfoStruct.engdepartname,
        departmentId: rawInfoStruct.departid,
        photoFileName: rawInfoStruct.photofile,
        phoneNumber: rawInfoStruct.tel,
        userGender: rawInfoStruct.sex,
        effectiveTimestamp: new Date(rawInfoStruct.identifyeffectdate),
        validTimestamp: new Date(rawInfoStruct.validatevalue),
        balance: rawInfoStruct.baseAccount.balance / 100,
        cardId: rawInfoStruct.cardInfos[0].cardid,
        cardStatus: rawInfoStruct.cardInfos[0].accstatus,
        lastTransactionTimestamp: new Date(rawInfoStruct.cardInfos[0].lasttxdate),
        maxDailyTransactionAmount: rawInfoStruct.cardInfos[0].maxconstolamt / 100,
        maxOneTimeTransactionAmount: rawInfoStruct.cardInfos[0].maxconsamt / 100,
    };

    accountBaseInfo.cardId = info.cardId;
    return info;
};

export const cardGetPhotoUrl = () => CARD_PHOTO_URL + accountBaseInfo.cardId;

export const cardGetTransactions = async (
    helper: InfoHelper,
    start: Date,
    end: Date,
    type: CardTransactionType = CardTransactionType.Any)
    : Promise<CardTransaction[]> => {
    await assureLoginValid(helper);

    const rawTransactionsData = await fetchWithParse(CARD_TRANSACTION_URL,
        {
            idserial: accountBaseInfo.user,
            starttime: start.toISOString().slice(0, 10),
            endtime: end.toISOString().slice(0, 10),
            tradetype: type,
            pageSize: 10000,
            pageNumber: 0,
        });

    return rawTransactionsData.rows.map((rawTransaction: any) => ({
        summary: rawTransaction.summary,
        timestamp: new Date(rawTransaction.txdate),
        balance: rawTransaction.balance / 100,
        amount: rawTransaction.txamt / 100,
    }));
};

export const cardChangeTransactionPassword = async (helper: InfoHelper, oldPassword: string, newPassword: string) => {
    await assureLoginValid(helper);

    await fetchWithParse(CARD_CHANGE_PWD_URL,
        {
            idserial: accountBaseInfo.user,
            oldpassword: oldPassword,
            txpassword: newPassword,
            authOldPwd: true,
        });
};

export const cardModifyMaxTransactionAmount = async (
    helper: InfoHelper,
    transactionPassword: string,
    maxDailyTranscationAmount: number,
    maxOneTimeTranscationAmount: number) => {
    await assureLoginValid(helper);

    if (accountBaseInfo.cardId === "") {
        await cardGetInfo(helper);
    }

    await fetchWithParse(CARD_MOD_MAX_CONSUME_URL, {
        maxconsamt: Math.floor(maxDailyTranscationAmount * 100),
        maxconstolamt: Math.floor(maxOneTimeTranscationAmount * 100),
        txpassword: transactionPassword,
        cardid: accountBaseInfo.cardId,
    });
};

export const cardReportLoss = async (helper: InfoHelper, transactionPassword: string) => {
    await assureLoginValid(helper);

    await fetchWithParse(CARD_REPORT_LOSS_URL,
        {
            idserial: accountBaseInfo.user,
            txpasswd: transactionPassword,
        });
};

export const cardCancelLoss = async (helper: InfoHelper, transactionPassword: string) => {
    await assureLoginValid(helper);

    await fetchWithParse(CARD_CANCEL_LOSS_URL,
        {
            idserial: accountBaseInfo.user,
            txpasswd: transactionPassword,
        });
};

export const cardRechargeFromBank = async (helper: InfoHelper, transactionPassword: string, amount: number) => {
    await assureLoginValid(helper);

    await fetchWithParse(CARD_RECHARGE_FROM_BANK_URL,
        {
            idserial: accountBaseInfo.user,
            txamt: Math.floor(amount * 100),
        });
};

const enum CardRechargeType {
    Wechat = "综合服务微信扫码充值",
    Alipay = "综合服务支付宝扫码充值",
}

export const cardRechargeFromWechatAlipay = async (helper: InfoHelper, amount: number, alipay: boolean)
    : Promise<string> => {
    await assureLoginValid(helper);

    const rawResponse = await fetchWithParse(CARD_RECHARGE_FROM_WECHAT_ALIPAY_URL,
        {
            idserial: accountBaseInfo.user,
            transamt: amount,
            paytype: alipay ? 3 : 2,
            productdesc: alipay ? CardRechargeType.Alipay : CardRechargeType.Wechat,
            method: "trade.pay.qrcode",
            tradetype: alipay ? "alipay.qrcode" : "weixin.qrcode",
        });

    if (rawResponse.success !== true) {
        throw new Error(rawResponse.message);
    }

    return JSON.parse(rawResponse.response).bizContent.webUrl;
};
