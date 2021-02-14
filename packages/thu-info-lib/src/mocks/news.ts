import {BGTZ_MAIN_PREFIX, HB_MAIN_PREFIX, JWGG_MAIN_PREFIX} from "../constants/strings";
import {url0, url1, url2, url3, url4, url5, url6, url7, url8, url9} from "./source/newsHtml";
import {NewsSlice} from "../models/news/news";

export const MOCK_NEWS_LIST = (url: string): NewsSlice[] => {
    switch (url) {
    case JWGG_MAIN_PREFIX + 0:
        return [
            {
                channel: "JWGG",
                date: "2020.09.16",
                name: "博士生思政课“中国马克思主义与当代”扩容通知",
                source: "研究生院",
                url: url0,
            },
            {
                channel: "JWGG",
                date: "2020.09.14",
                name: "研究生补退选时间安排（2020-2021秋）",
                source: "教务处",
                url: url1,
            },
            {
                channel: "JWGG",
                date: "2020.09.14",
                name: "本科生补退选时间安排（2020-2021秋）",
                source: "教务处",
                url: url2,
            },
            {
                channel: "JWGG",
                date: "2020.09.14",
                name: "2020-2021学年秋季学期SRT立项通知",
                source: "教务处",
                url: url3,
            },
        ];
    case BGTZ_MAIN_PREFIX + 0:
        return [
            {
                channel: "BGTZ",
                date: "2020.09.17",
                name: "第二十二届清华大学创业大赛参赛报名通知",
                source: "校团委",
                url: url4,
            },
            {
                channel: "BGTZ",
                date: "2020.09.17",
                name: "清华大学“启·创”学生创业人才培育计划八期公开招募通知",
                source: "校团委",
                url: url5,
            },
            {
                channel: "BGTZ",
                date: "2020.09.17",
                name: "关于召开2020年度人事工作会的通知",
                source: "人事处",
                url: url6,
            },
        ];
    case HB_MAIN_PREFIX + 0:
        return [
            {
                channel: "HB",
                date: "2020.09.17",
                name: "2020年10月三场“LIVE 逍遥夜”演出开票公告",
                source: "艺教中心办公室",
                url: url7,
            },
            {
                channel: "HB",
                date: "2020.09.15",
                name:
                    "清华大学“唯真讲坛”系列在线理论宣讲活动第二十讲 当前的国际形势与热点问题",
                source: "党委宣传部",
                url: url8,
            },
            {
                channel: "HB",
                date: "2020.09.14",
                name:
                    "金融科技还是科技金融？——数字刀如何切开金融蛋糕|清华五道口云课堂之金融大家评·华尔街热线（第15期）",
                source: "五道口金融学院综合办公室",
                url: url9,
            },
        ];
    default:
        return [];
    }
};
