import {SportsReservationRecord, SportsResourcesInfo} from "../models/home/sports";

export const MOCK_RESOURCES: SportsResourcesInfo = {
    count: 1,
    init: 1,
    phone: "88888888888",
    data: [
        {
            resId: "14567229",
            timeSession: "20:00-21:00",
            fieldName: "台1",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567231",
            timeSession: "19:00-20:00",
            fieldName: "台1",
            overlaySize: 2,
            canNetBook: true,
            cost: 0,
            bookId: "15674139",
            locked: true,
            userType: "学生",
            paymentStatus: true
        },
        {
            resId: "14567233",
            timeSession: "18:00-19:00",
            fieldName: "台1",
            overlaySize: 2,
            canNetBook: true,
            cost: 0,
            bookId: "15674132",
            locked: true,
            userType: "学生",
            paymentStatus: true
        },
        {
            resId: "14567235",
            timeSession: "17:00-18:00",
            fieldName: "台1",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567279",
            timeSession: "20:00-21:00",
            fieldName: "台2",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567281",
            timeSession: "19:00-20:00",
            fieldName: "台2",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567283",
            timeSession: "18:00-19:00",
            fieldName: "台2",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567285",
            timeSession: "17:00-18:00",
            fieldName: "台2",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567329",
            timeSession: "20:00-21:00",
            fieldName: "台3",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567331",
            timeSession: "19:00-20:00",
            fieldName: "台3",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567333",
            timeSession: "18:00-19:00",
            fieldName: "台3",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567335",
            timeSession: "17:00-18:00",
            fieldName: "台3",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567379",
            timeSession: "20:00-21:00",
            fieldName: "台4",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567381",
            timeSession: "19:00-20:00",
            fieldName: "台4",
            overlaySize: 2,
            canNetBook: true,
            cost: 0,
            bookId: "15670874",
            locked: true,
            userType: "老师",
            paymentStatus: true
        },
        {
            resId: "14567383",
            timeSession: "18:00-19:00",
            fieldName: "台4",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567385",
            timeSession: "17:00-18:00",
            fieldName: "台4",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567429",
            timeSession: "20:00-21:00",
            fieldName: "台5",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567431",
            timeSession: "19:00-20:00",
            fieldName: "台5",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567433",
            timeSession: "18:00-19:00",
            fieldName: "台5",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567435",
            timeSession: "17:00-18:00",
            fieldName: "台5",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567479",
            timeSession: "20:00-21:00",
            fieldName: "台6",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567481",
            timeSession: "19:00-20:00",
            fieldName: "台6",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567483",
            timeSession: "18:00-19:00",
            fieldName: "台6",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567485",
            timeSession: "17:00-18:00",
            fieldName: "台6",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567529",
            timeSession: "20:00-21:00",
            fieldName: "台7",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567531",
            timeSession: "19:00-20:00",
            fieldName: "台7",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567533",
            timeSession: "18:00-19:00",
            fieldName: "台7",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        },
        {
            resId: "14567535",
            timeSession: "17:00-18:00",
            fieldName: "台7",
            overlaySize: 2,
            canNetBook: true,
            cost: 0
        }
    ]
};

export const MOCK_RECORDS: SportsReservationRecord[] = [
    {
        name: "西体育馆",
        field: "西体台球 (台7)",
        time: "2021-10-06  20:00-21:00",
        price: "15.0",
        bookId: undefined
    },
    {
        name: "西体育馆",
        field: "西体羽毛球场 (羽4)",
        time: "2021-10-07  7:00-8:00",
        price: "0.0",
        bookId: undefined
    },
    {
        name: "西体育馆",
        field: "西体羽毛球场 (羽8)",
        time: "2021-10-08  7:00-8:00",
        price: "0.0",
        bookId: undefined
    }
]
;
