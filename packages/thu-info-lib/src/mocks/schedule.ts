import {ScheduleType, Schedule, TimeSlice, ScheduleTime} from "../models/schedule/schedule";

export const MOCK_PRIMARY_SCHEDULE = [
    new Schedule(
        "回笼觉设计与梦境工程",
        "2.0*0.9的宿舍床",
        ScheduleType.PRIMARY,
        [new TimeSlice(1, 1, 2, ScheduleTime.MAX_WEEK_LIST)]
    ),
    new Schedule(
        "摸鱼学导论",
        "实验室和社工组织",
        ScheduleType.PRIMARY,
        [new TimeSlice(1, 6, 7, ScheduleTime.MAX_WEEK_LIST)]
    ),
    new Schedule(
        "临时进出校基本原理",
        "学生部、研工部",
        ScheduleType.PRIMARY,
        [new TimeSlice(2, 3, 5, ScheduleTime.MAX_WEEK_LIST)]
    ),
    new Schedule(
        "学婊艺术欣赏",
        "院系年级微信群",
        ScheduleType.PRIMARY,
        [new TimeSlice(2, 8, 9, ScheduleTime.MAX_WEEK_LIST)]
    ),
    new Schedule(
        "社畜学的想象力：拖延、甩锅与膜人",
        "桃李一层",
        ScheduleType.PRIMARY,
        [new TimeSlice(2, 12, 13, ScheduleTime.MAX_WEEK_LIST)]
    ),
    new Schedule(
        "初级校园新闻采写",
        "知乎",
        ScheduleType.PRIMARY,
        [new TimeSlice(3, 6, 7, ScheduleTime.MAX_WEEK_LIST)]
    ),
    new Schedule(
        "退学案例分析研讨课",
        "教务处",
        ScheduleType.PRIMARY,
        [new TimeSlice(4, 6, 7, ScheduleTime.MAX_WEEK_LIST)]
    ),
    new Schedule(
        "打包、取件与排队论",
        "紫荆14号楼北快递点",
        ScheduleType.PRIMARY,
        [new TimeSlice(4, 10, 11, ScheduleTime.MAX_WEEK_LIST)]
    ),
    new Schedule(
        "淘宝优惠数值计算",
        "智能手机",
        ScheduleType.PRIMARY,
        [new TimeSlice(4, 12, 13, ScheduleTime.MAX_WEEK_LIST)]
    ),
    new Schedule(
        "游戏氪金理论与实践",
        "PC/主机/智能设备",
        ScheduleType.PRIMARY,
        [new TimeSlice(5, 3, 5, ScheduleTime.MAX_WEEK_LIST)]
    ),
    new Schedule(
        "树洞文学中的清华形象",
        "THUHole",
        ScheduleType.PRIMARY,
        [new TimeSlice(5, 8, 9, ScheduleTime.MAX_WEEK_LIST)]
    ),
];

export const MOCK_SECONDARY_SCHEDULE = [];
