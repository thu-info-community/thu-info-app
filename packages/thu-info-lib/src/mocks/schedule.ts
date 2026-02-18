import {ScheduleType} from "../models/schedule/schedule";
import dayjs from "dayjs";

// Mock semester first day (assuming a Monday)
const MOCK_FIRST_DAY = "2024-09-09";

const createTimeSlice = (dayOfWeek: number, beginPeriod: number, endPeriod: number, week: number) => {
    const beginTimes = ["", "08:00", "08:50", "09:50", "10:40", "11:30", "13:30", "14:20", "15:20", "16:10", "17:05", "17:55", "19:20", "20:10", "21:00"];
    const endTimes = ["", "08:45", "09:35", "10:35", "11:25", "12:15", "14:15", "15:05", "16:05", "16:55", "17:50", "18:40", "20:05", "20:55", "21:45"];
    const courseDate = dayjs(MOCK_FIRST_DAY).add((week - 1) * 7, "day").add(dayOfWeek - 1, "day");
    return {
        dayOfWeek,
        beginTime: dayjs(`${courseDate.format("YYYY-MM-DD")} ${beginTimes[beginPeriod]}`),
        endTime: dayjs(`${courseDate.format("YYYY-MM-DD")} ${endTimes[endPeriod]}`),
    };
};

export const MOCK_PRIMARY_SCHEDULE = [
    {
        name: "回笼觉设计与梦境工程",
        location: "2.0*0.9的宿舍床",
        hash: "1",
        type: ScheduleType.PRIMARY,
        activeTime: {base: Array.from({length: 18}, (_, i) => createTimeSlice(1, 1, 2, i + 1))},
        delOrHideTime: {base: []},
    },
    {
        name: "摸鱼学导论",
        location: "实验室和社工组织",
        hash: "2",
        type: ScheduleType.PRIMARY,
        activeTime: {base: Array.from({length: 18}, (_, i) => createTimeSlice(1, 6, 7, i + 1))},
        delOrHideTime: {base: []},
    },
    {
        name: "临时进出校基本原理",
        location: "学生部、研工部",
        hash: "3",
        type: ScheduleType.PRIMARY,
        activeTime: {base: Array.from({length: 18}, (_, i) => createTimeSlice(2, 3, 5, i + 1))},
        delOrHideTime: {base: []},
    },
    {
        name: "学婊艺术欣赏",
        location: "院系年级微信群",
        hash: "4",
        type: ScheduleType.PRIMARY,
        activeTime: {base: Array.from({length: 18}, (_, i) => createTimeSlice(2, 8, 9, i + 1))},
        delOrHideTime: {base: []},
    },
    {
        name: "社畜学的想象力：拖延、甩锅与膜人",
        location: "桃李一层",
        hash: "5",
        type: ScheduleType.PRIMARY,
        activeTime: {base: Array.from({length: 18}, (_, i) => createTimeSlice(2, 12, 13, i + 1))},
        delOrHideTime: {base: []},
    },
    {
        name: "初级校园新闻采写",
        location: "知乎",
        hash: "6",
        type: ScheduleType.PRIMARY,
        activeTime: {base: Array.from({length: 18}, (_, i) => createTimeSlice(3, 6, 7, i + 1))},
        delOrHideTime: {base: []},
    },
    {
        name: "退学案例分析研讨课",
        location: "教务处",
        hash: "7",
        type: ScheduleType.PRIMARY,
        activeTime: {base: Array.from({length: 18}, (_, i) => createTimeSlice(4, 6, 7, i + 1))},
        delOrHideTime: {base: []},
    },
    {
        name: "打包、取件与排队论",
        location: "紫荆14号楼北快递点",
        hash: "8",
        type: ScheduleType.PRIMARY,
        activeTime: {base: Array.from({length: 18}, (_, i) => createTimeSlice(4, 10, 11, i + 1))},
        delOrHideTime: {base: []},
    },
    {
        name: "淘宝优惠数值计算",
        location: "智能手机",
        hash: "9",
        type: ScheduleType.PRIMARY,
        activeTime: {base: Array.from({length: 18}, (_, i) => createTimeSlice(4, 12, 13, i + 1))},
        delOrHideTime: {base: []},
    },
    {
        name: "游戏氪金理论与实践",
        location: "PC/主机/智能设备",
        hash: "10",
        type: ScheduleType.PRIMARY,
        activeTime: {base: Array.from({length: 18}, (_, i) => createTimeSlice(5, 3, 5, i + 1))},
        delOrHideTime: {base: []},
    },
    {
        name: "树洞文学中的清华形象",
        location: "THUHole",
        hash: "11",
        type: ScheduleType.PRIMARY,
        activeTime: {base: Array.from({length: 18}, (_, i) => createTimeSlice(5, 8, 9, i + 1))},
        delOrHideTime: {base: []},
    },
];

export const MOCK_SECONDARY_SCHEDULE = [];
