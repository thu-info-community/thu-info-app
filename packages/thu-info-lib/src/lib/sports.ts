import {roamingWrapperWithMocks} from "./core";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {
    SPORTS_BASE_URL,
    SPORTS_CAPTCHA_BASE_URL,
    SPORTS_DETAIL_URL,
    SPORTS_MAKE_ORDER_URL,
    SPORTS_MAKE_PAYMENT_URL,
    SPORTS_PAYMENT_ACTION_URL,
    SPORTS_PAYMENT_CHECK_URL,
    SPORTS_QUERY_PHONE_URL,
    SPORTS_UNSUBSCRIBE_URL,
    SPORTS_UPDATE_PHONE_URL,
} from "../constants/strings";
import {SportsIdInfo, SportsReservationRecord, SportsResource, SportsResourcesInfo} from "../models/home/sports";
import {MOCK_RECORDS, MOCK_RESOURCES} from "../mocks/sports";
import cheerio from "cheerio";
import TagElement = cheerio.TagElement;
import {generalGetPayCode} from "../utils/alipay";
import {getCheerioText} from "../utils/cheerio";
import Element = cheerio.Element;
import {LibError, SportsError} from "../utils/error";

export const VALID_RECEIPT_TITLES = ["清华大学", "清华大学工会", "清华大学教育基金会"] as const;
export type ValidReceiptTypes = typeof VALID_RECEIPT_TITLES[number];

const getSportsResourceLimit = async (
    helper: InfoHelper,
    gymId: string,
    itemId: string,
    date: string, // yyyy-MM-dd
) => {
    const rawHtml = await uFetch(`${SPORTS_BASE_URL}&gymnasium_id=${gymId}&item_id=${itemId}&time_date=${date}`);
    const countSearch = /var limitBookCount = '(\d+?)';/.exec(rawHtml);
    const initSearch = /var limitBookInit = '(\d+?)';/.exec(rawHtml);
    if (countSearch === null || initSearch === null) {
        throw new SportsError("Exception occurred during getting sports resource limit");
    }
    return {count: Number(countSearch[1]), init: Number(initSearch[1])};
};

const getSportsResourceData = async (
    helper: InfoHelper,
    gymId: string,
    itemId: string,
    date: string, // yyyy-MM-dd
): Promise<SportsResource[]> => {
    const rawHtml = await uFetch(`${SPORTS_DETAIL_URL}&gymnasium_id=${gymId}&item_id=${itemId}&time_date=${date}`);
    const result: { [key: string]: SportsResource } = {};

    // Step one: get total resources
    const p1 = /resourceArray\.push\({id:'(.*?)',time_session:'(.*?)',field_name:'(.*?)',overlaySize:'(.*?)',can_net_book:'(.*?)'}\);[\s\S]+?resourcesm\.put\('(.*?)', '(.*?)'\)/gm;
    for (let r1 = p1.exec(rawHtml); r1 != null; r1 = p1.exec(rawHtml)) {
        if (r1[1] === r1[6]) {
            result[r1[1]] = {
                resId: r1[1],
                resHash: r1[7],
                timeSession: r1[2],
                fieldName: r1[3],
                overlaySize: Number(r1[4]),
                canNetBook: r1[5] === "1",
            } as SportsResource;
        }
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
};

const getSportsPhoneNumber = async (): Promise<string | undefined> =>
    uFetch(SPORTS_QUERY_PHONE_URL).then((msg) => msg === "do_not" ? undefined : msg);

export const updateSportsPhoneNumber = async (
    helper: InfoHelper,
    phone: string,
): Promise<void> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "5539ECF8CD815C7D3F5A8EE0A2D72441",
        async () => {
            if (!/^(1[3-9][0-9]|15[036789]|18[89])\d{8}$/.test(phone)) {
                throw new SportsError("请正确填写手机号码!");
            }
            const response = await uFetch(`${SPORTS_UPDATE_PHONE_URL}${phone}&gzzh=${helper.userId}`, {});
            if (response.includes("找回密码")) {
                throw new LibError();
            }
        },
        undefined,
    );

export const getSportsResources = async (
    helper: InfoHelper,
    gymId: string,
    itemId: string,
    date: string, // yyyy-MM-dd
): Promise<SportsResourcesInfo> =>
    roamingWrapperWithMocks(
        helper,
        "default",
        "5539ECF8CD815C7D3F5A8EE0A2D72441",
        async () => Promise.all([
            getSportsResourceLimit(helper, gymId, itemId, date),
            getSportsPhoneNumber(),
            getSportsResourceData(helper, gymId, itemId, date),
        ]).then(([{count, init}, phone, data]) => ({count, init, phone, data})),
        MOCK_RESOURCES,
    );

export const getSportsCaptchaUrlMethod = (): string => `${SPORTS_CAPTCHA_BASE_URL}?${Math.floor(Math.random() * 100)}=`;

export const makeSportsReservation = async (
    helper: InfoHelper,
    totalCost: number,
    phone: string,
    receiptTitle: ValidReceiptTypes | undefined,
    gymId: string,
    itemId: string,
    date: string,  // yyyy-MM-dd
    captcha: string,
    resHashId: string,
): Promise<string | undefined> => {
    if (helper.mocked()) {
        return undefined;
    }
    const orderResult = await uFetch(SPORTS_MAKE_ORDER_URL, {
        "bookData.totalCost": totalCost,
        "bookData.book_person_zjh": "",
        "bookData.book_person_name": "",
        "bookData.book_person_phone": phone,
        "bookData.book_mode": "from-phone",
        "gymnasium_idForCache": gymId,
        "item_idForCache": itemId,
        "time_dateForCache": date,
        "userTypeNumForCache": 1,
        "putongRes": "putongRes",
        "code": captcha,
        "selectedPayWay": 1,
        "allFieldTime": `${resHashId}#${date}`,
    }).then(JSON.parse);
    if (orderResult.msg !== "预定成功") {
        throw new SportsError(orderResult.msg);
    }
    if (totalCost === 0) return undefined;
    const paymentResultForm = await uFetch(SPORTS_MAKE_PAYMENT_URL, {
        is_jsd: receiptTitle === undefined ? "0" : "1",
        xm: receiptTitle ?? "清华大学",
        gymnasium_idForCache: gymId,
        item_idForCache: itemId,
        time_dateForCache: date,
        userTypeNumForCache: 1,
        allFieldTime: `${resHashId}#${date}`,
    }, 60000, "GBK").then((s) => cheerio.load(s)("form"));
    const paymentApiHtml = await uFetch(
        paymentResultForm.attr().action, // TODO found a bug here: attr() returns undefined
        paymentResultForm.serialize() as never as object,
        60000,
        "UTF-8",
        true,
    );
    const searchResult = /var id = '(.*)?';\s*?var token = '(.*)?';/.exec(paymentApiHtml);
    if (searchResult === null) {
        throw new SportsError("id and token not found.");
    }
    const paymentCheckResult = await uFetch(SPORTS_PAYMENT_CHECK_URL, {
        id: searchResult[1],
        token: searchResult[2],
    }).then(JSON.parse);
    if (paymentCheckResult.code !== "0") {
        throw new SportsError("Payment check failed: " + paymentCheckResult.message);
    }
    const inputs = cheerio.load(paymentApiHtml)("#payForm input");
    const postForm: { [key: string]: string } = {};
    inputs.each((_, element) => {
        const {attribs} = element as TagElement;
        postForm[attribs.name] = attribs.value;
    });
    postForm.channelId = "0101";
    return await generalGetPayCode(await uFetch(SPORTS_PAYMENT_ACTION_URL, postForm));
};

export const getSportsReservationRecords = async (
    helper: InfoHelper,
) => roamingWrapperWithMocks(
    helper,
    "default",
    "5539ECF8CD815C7D3F5A8EE0A2D72441",
    async () => {
        const $ = await uFetch(SPORTS_BASE_URL + "&gymnasium_id=4836273").then(cheerio.load);
        const tables = $("table");
        if (tables.length === 0) {
            throw new SportsError();
        }
        const rows = cheerio(tables.toArray()[tables.length - 1]).find("tbody tr");
        const getId = (e: Element) => {
            try {
                const s0 = ((((e as TagElement).children[9] as TagElement).children[1] as TagElement).attribs.onclick);
                const res0 = /unsubscribe\('(.+?)'/.exec(s0);
                if (res0 === null) {
                    const s1 = (((((e as TagElement).children[9] as TagElement).children[4] as TagElement).children[3] as TagElement).attribs.onclick);
                    const res1 = /unsubscribeOnline\('(.+?)'/.exec(s1);
                    if (res1 === null) return undefined;
                    return res1[1];
                }
                return res0[1];
            } catch {
                return undefined;
            }
        };
        return rows.toArray().map((e) => ({
            name: getCheerioText(e, 1),
            field: getCheerioText(e, 3),
            time: getCheerioText(e, 5),
            price: getCheerioText(e, 7),
            bookId: getId(e),
        } as SportsReservationRecord));
    },
    MOCK_RECORDS,
);

export const unsubscribeSportsReservation = async (
    helper: InfoHelper,
    bookId: string,
) => roamingWrapperWithMocks(
    helper,
    "default",
    "5539ECF8CD815C7D3F5A8EE0A2D72441",
    async () => {
        await uFetch(SPORTS_UNSUBSCRIBE_URL, {bookId});
    },
    undefined,
);

export const sportsIdInfoList: SportsIdInfo[] = [
    {
        name: "气膜馆羽毛球场",
        gymId: "3998000",
        itemId: "4045681",
    },
    {
        name: "气膜馆乒乓球场",
        gymId: "3998000",
        itemId: "4037036",
    },
    {
        name: "综体篮球场",
        gymId: "4797914",
        itemId: "4797898",
    },
    {
        name: "综体羽毛球场",
        gymId: "4797914",
        itemId: "4797899",
    },
    {
        name: "西体羽毛球场",
        gymId: "4836273",
        itemId: "4836196",
    },
    {
        name: "西体台球",
        gymId: "4836273",
        itemId: "14567218",
    },
    {
        name: "紫荆网球场",
        gymId: "5843934",
        itemId: "5845263",
    },
    {
        name: "西网球场",
        gymId: "5843934",
        itemId: "10120539",
    },
];
