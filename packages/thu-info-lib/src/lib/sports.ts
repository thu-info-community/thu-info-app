import {retryWrapperWithMocks} from "./core";
import {InfoHelper} from "../index";
import {uFetch} from "../utils/network";
import {
    SPORTS_BASE_URL,
    SPORTS_CAPTCHA_BASE_URL,
    SPORTS_DETAIL_URL,
    SPORTS_MAKE_ORDER_URL,
    SPORTS_MAKE_PAYMENT_URL,
    SPORTS_PAYMENT_ACTION_URL,
    SPORTS_PAYMENT_API_URL,
    SPORTS_PAYMENT_CHECK_URL,
    SPORTS_QUERY_PHONE_URL,
    SPORTS_UNSUBSCRIBE_URL,
    SPORTS_UPDATE_PHONE_URL,
} from "../constants/strings";
import {SportsIdInfo, SportsReservationRecord, SportsResource, SportsResourcesInfo} from "../models/home/sports";
import {MOCK_RESOURCES} from "../mocks/sports";
import cheerio from "cheerio";
import TagElement = cheerio.TagElement;
import {generalGetPayCode} from "../utils/alipay";
import {getCheerioText} from "../utils/cheerio";
import Element = cheerio.Element;

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
        throw new Error("Exception occurred during getting sports resource limit");
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
};

const getSportsPhoneNumber = async (): Promise<string | undefined> =>
    uFetch(SPORTS_QUERY_PHONE_URL).then((msg) => msg === "do_not" ? undefined : msg);

export const updateSportsPhoneNumber = async (
    helper: InfoHelper,
    phone: string,
): Promise<void> =>
    retryWrapperWithMocks(
        helper,
        424,
        async () => {
            if (!/^(1[3-9][0-9]|15[036789]|18[89])\d{8}$/.test(phone)) {
                throw new Error("请正确填写手机号码!");
            }
            await uFetch(`${SPORTS_UPDATE_PHONE_URL}${phone}&gzzh=${helper.userId}`, SPORTS_BASE_URL, {});
        },
        undefined,
    );

export const getSportsResources = async (
    helper: InfoHelper,
    gymId: string,
    itemId: string,
    date: string, // yyyy-MM-dd
): Promise<SportsResourcesInfo> =>
    retryWrapperWithMocks(
        helper,
        424,
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
    gymId: string,
    itemId: string,
    date: string,  // yyyy-MM-dd
    captcha: string,
    fieldId: string,
): Promise<string | undefined> => {
    const orderResult = await uFetch(SPORTS_MAKE_ORDER_URL, SPORTS_BASE_URL, {
        "bookData.totalCost": totalCost,
        "bookData.book_person_zjh": "",
        "bookData.book_person_name": "",
        "bookData.book_person_phone": phone,
        "bookData.book_mode": "from-phone",
        "item_idForCache": itemId,
        "time_dateForCache": date,
        "userTypeNumForCache": 1,
        "putongRes": "putongRes",
        "code": captcha,
        "selectedPayWay": 1,
        "allFieldTime": `${fieldId}#${date}`,
    }).then(JSON.parse);
    if (orderResult.msg !== "预定成功") {
        throw new Error(orderResult.msg);
    }
    if (totalCost === 0) return undefined;
    const payRequestResult = await uFetch(SPORTS_MAKE_PAYMENT_URL, SPORTS_BASE_URL, {
        xm: "",
        dept: "",
        gymnasium_idForCache: gymId,
        item_idForCache: itemId,
        time_dateForCache: date,
        userTypeNumForCache: 1,
        allFieldTime: `${fieldId}#${date}`,
    }).then(JSON.parse);
    delete payRequestResult.action;
    const paymentApiHtml = await uFetch(SPORTS_PAYMENT_API_URL, SPORTS_BASE_URL, payRequestResult);
    const searchResult = /var id = '(.*)?';\s*?var token = '(.*)?';/.exec(paymentApiHtml);
    if (searchResult === null) {
        throw new Error("id and token not found.");
    }
    const paymentCheckResult = await uFetch(SPORTS_PAYMENT_CHECK_URL, SPORTS_PAYMENT_API_URL, {
        id: searchResult[1],
        token: searchResult[2],
    }).then(JSON.parse);
    if (paymentCheckResult.code !== "0") {
        throw new Error("Payment check failed: " + paymentCheckResult.message);
    }
    const inputs = cheerio.load(paymentApiHtml)("#payForm input");
    const postForm: { [key: string]: string } = {};
    inputs.each((_, element) => {
        const {attribs} = element as TagElement;
        postForm[attribs.name] = attribs.value;
    });
    postForm.channelId = "0101";
    return generalGetPayCode(await uFetch(SPORTS_PAYMENT_ACTION_URL, SPORTS_PAYMENT_API_URL, postForm));
};

export const getSportsReservationRecords = async (
    helper: InfoHelper,
) => retryWrapperWithMocks(
    helper,
    424,
    async () => {
        const $ = await uFetch(SPORTS_BASE_URL + "&gymnasium_id=4836273", SPORTS_BASE_URL).then(cheerio.load);
        const tables = $("table");
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
    [],
);

export const unsubscribeSportsReservation = async (
    helper: InfoHelper,
    bookId: string,
) => retryWrapperWithMocks(
    helper,
    424,
    async () => {
        await uFetch(SPORTS_UNSUBSCRIBE_URL, SPORTS_BASE_URL, {bookId});
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
