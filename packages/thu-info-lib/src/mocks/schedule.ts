import {ScheduleType} from "../models/schedule/schedule";

export const MOCK_PRIMARY_SCHEDULE = [
    {
        name: "回笼觉设计与梦境工程",
        location: "2.0*0.9的宿舍床",
        activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
            (val) => ({
                week: val,
                dayOfWeek: 1,
                begin: 1,
                end: 2,
            }),
        ),
        delOrHideTime: [],
        delOrHideDetail: [],
        type: ScheduleType.PRIMARY,
    },
    {
        name: "摸鱼学导论",
        location: "实验室和社工组织",
        activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
            (val) => ({
                week: val,
                dayOfWeek: 1,
                begin: 6,
                end: 7,
            }),
        ),
        delOrHideTime: [],
        delOrHideDetail: [],
        type: ScheduleType.PRIMARY,
    },
    {
        name: "临时进出校基本原理",
        location: "学生部、研工部",
        activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
            (val) => ({
                week: val,
                dayOfWeek: 2,
                begin: 3,
                end: 5,
            }),
        ),
        delOrHideTime: [],
        delOrHideDetail: [],
        type: ScheduleType.PRIMARY,
    },
    {
        name: "学婊艺术欣赏",
        location: "院系年级微信群",
        activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
            (val) => ({
                week: val,
                dayOfWeek: 2,
                begin: 8,
                end: 9,
            }),
        ),
        delOrHideTime: [],
        delOrHideDetail: [],
        type: ScheduleType.PRIMARY,
    },
    {
        name: "社畜学的想象力：拖延、甩锅与膜人",
        location: "桃李一层",
        activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
            (val) => ({
                week: val,
                dayOfWeek: 2,
                begin: 12,
                end: 13,
            }),
        ),
        delOrHideTime: [],
        delOrHideDetail: [],
        type: ScheduleType.PRIMARY,
    },
    {
        name: "初级校园新闻采写",
        location: "知乎",
        activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
            (val) => ({
                week: val,
                dayOfWeek: 3,
                begin: 6,
                end: 7,
            }),
        ),
        delOrHideTime: [],
        delOrHideDetail: [],
        type: ScheduleType.PRIMARY,
    },
    {
        name: "退学案例分析研讨课",
        location: "教务处",
        activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
            (val) => ({
                week: val,
                dayOfWeek: 4,
                begin: 6,
                end: 7,
            }),
        ),
        delOrHideTime: [],
        delOrHideDetail: [],
        type: ScheduleType.PRIMARY,
    },
    {
        name: "打包、取件与排队论",
        location: "紫荆14号楼北快递点",
        activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
            (val) => ({
                week: val,
                dayOfWeek: 4,
                begin: 10,
                end: 11,
            }),
        ),
        delOrHideTime: [],
        delOrHideDetail: [],
        type: ScheduleType.PRIMARY,
    },
    {
        name: "淘宝优惠数值计算",
        location: "智能手机",
        activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
            (val) => ({
                week: val,
                dayOfWeek: 4,
                begin: 12,
                end: 13,
            }),
        ),
        delOrHideTime: [],
        delOrHideDetail: [],
        type: ScheduleType.PRIMARY,
    },
    {
        name: "游戏氪金理论与实践",
        location: "PC/主机/智能设备",
        activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
            .map((val) => ({
                week: val,
                dayOfWeek: 5,
                begin: 3,
                end: 5,
            }))
            .concat(
                [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((val) => ({
                    week: val,
                    dayOfWeek: 6,
                    begin: 1,
                    end: 2,
                })),
            ),
        delOrHideTime: [],
        delOrHideDetail: [],
        type: ScheduleType.PRIMARY,
    },
    {
        name: "树洞文学中的清华形象",
        location: "THUHole",
        activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
            (val) => ({
                week: val,
                dayOfWeek: 5,
                begin: 8,
                end: 9,
            }),
        ),
        delOrHideTime: [],
        delOrHideDetail: [],
        type: ScheduleType.PRIMARY,
    },
];

export const MOCK_SECONDARY_SCHEDULE = [];

export const MOCK_SECONDARY_VERBOSE = [];
