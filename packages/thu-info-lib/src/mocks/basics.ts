import {Form, InputTag, Overall, Person} from "../models/home/assessment";
import {Record} from "../models/home/expenditure";
import {BankPaymentByMonth} from "../models/home/bank";

export const MOCK_REPORT = [
    {
        credit: 2,
        grade: "A+",
        name: "军事理论",
        point: 4,
        semester: "2019-夏",
    },
    {
        credit: 2,
        grade: "A+",
        name: "军事技能",
        point: 4,
        semester: "2019-夏",
    },
    {
        credit: 5,
        grade: "A+",
        name: "微积分A(1)",
        point: 4,
        semester: "2019-秋",
    },
    {
        credit: 4,
        grade: "A+",
        name: "线性代数",
        point: 4,
        semester: "2019-秋",
    },
    {
        credit: 3,
        grade: "A+",
        name: "思想道德修养与法律基础",
        point: 4,
        semester: "2019-秋",
    },
    {
        credit: 1,
        grade: "A+",
        name: "体育(1)",
        point: 4,
        semester: "2019-秋",
    },
    {
        credit: 5,
        grade: "A+",
        name: "微积分A(2)",
        point: 4,
        semester: "2020-春",
    },
    {
        credit: 4,
        grade: "A+",
        name: "大学物理B(1)",
        point: 4,
        semester: "2020-春",
    },
    {
        credit: 3,
        grade: "A+",
        name: "中国近现代史纲要",
        point: 4,
        semester: "2020-春",
    },
    {
        credit: 1,
        grade: "A+",
        name: "形势与政策",
        point: 4,
        semester: "2020-春",
    },
    {
        credit: 1,
        grade: "A+",
        name: "体育(2)",
        point: 4,
        semester: "2020-春",
    },
];

export const MOCK_ASSESSMENT_LIST = [
    ["微积分A(2)", true, "Mr. Z"],
    ["高等线性代数选讲", true, "Mr. L"],
    ["大学物理B(1)", true, "Mr. L"],
    ["中国近代史纲要", true, "Ms. S"],
    ["形势与政策", true, "Mr. L"],
    ["一年级男生体育(2)", true, "Mr. Y"],
    ["离散数学(2)", true, "Mr. Z"],
    ["面向对象的程序设计基础", true, "Mr. H"],
];

const makeMockQuestion = (question: string) => ({
    question,
    suggestion: new InputTag("", ""),
    score: new InputTag("", "7"),
    others: [],
});

export const MOCK_ASSESSMENT_FORM = (url: string) => new Form(
    [],
    new Overall(new InputTag("", ""), new InputTag("", "7")),
    [
        new Person(url, [
            makeMockQuestion("老师教学态度认真负责"),
            makeMockQuestion("老师讲解清楚，深入浅出"),
            makeMockQuestion("老师关注我们和我们的学习"),
            makeMockQuestion("老师严格要求，促使我认真学习"),
            makeMockQuestion("老师教学注重师生互动"),
            makeMockQuestion("老师教学能让我体会学科特点和思维方式"),
            makeMockQuestion("课程教学符合教学大纲"),
            makeMockQuestion("老师的教学有效激发我的学习志趣"),
        ]),
    ],
    [],
);

export const MOCK_PHYSICAL_EXAM_RESULT = [
    ["是否免测", "否"],
    ["免测原因", ""],
    ["总分", "300"],
    ["标准分", "300"],
    ["附加分", "0"],
    ["长跑附加分", "0"],
    ["身高", "175"],
    ["体重", "66"],
    ["身高体重分数", "40"],
    ["肺活量", "2000"],
    ["肺活量分数", "20"],
    ["800M跑", "3'40"],
    ["800M跑分数", "50"],
    ["1000M跑", ""],
    ["1000M跑分数", ""],
    ["50M跑", "8.7"],
    ["50M跑分数", "40"],
    ["立定跳远", "1.9"],
    ["立定跳远分数", "20"],
    ["坐位体前屈", "10"],
    ["坐位体前屈分数", "30"],
    ["仰卧起坐", ""],
    ["仰卧起坐分数", ""],
    ["引体向上", "10"],
    ["引体向上分数", "20"],
    ["体育课成绩", ""],
] as [string, string][];

export const MOCK_EXPENDITURES = [
    [
        {
            category: "消费",
            date: "2020-09-19 11:38",
            locale: "饮食中心",
            value: -6.45,
        },
        {
            category: "消费",
            date: "2020-09-19 07:12",
            locale: "饮食中心",
            value: -3.2,
        },
        {
            category: "消费",
            date: "2020-09-18 18:02",
            locale: "饮食中心",
            value: -8,
        },
        {
            category: "消费",
            date: "2020-09-18 07:30",
            locale: "饮食中心",
            value: -4.5,
        },
        {
            category: "消费",
            date: "2020-09-17 17:52",
            locale: "饮食中心",
            value: -8.8,
        },
        {
            category: "消费",
            date: "2020-09-17 11:46",
            locale: "饮食中心",
            value: -6.5,
        },
        {
            category: "消费",
            date: "2020-09-17 08:33",
            locale: "饮食中心",
            value: -4,
        },
        {
            category: "消费",
            date: "2020-09-16 18:01",
            locale: "饮食中心",
            value: -6.45,
        },
        {
            category: "消费",
            date: "2020-09-16 11:45",
            locale: "饮食中心",
            value: -8,
        },
        {
            category: "消费",
            date: "2020-09-16 07:25",
            locale: "饮食中心",
            value: -4.7,
        },
        {
            category: "消费",
            date: "2020-09-15 11:55",
            locale: "饮食中心",
            value: -5.7,
        },
        {
            category: "消费",
            date: "2020-09-15 07:08",
            locale: "饮食中心",
            value: -2.5,
        },
        {
            category: "自助缴费(学生公寓水费)",
            date: "2020-09-14 18:37",
            locale: "桃李园西门厅左",
            value: -20,
        },
        {
            category: "领取圈存",
            date: "2020-09-14 18:37",
            locale: "桃李园西门厅左",
            value: 300,
        },
        {
            category: "消费",
            date: "2020-09-14 18:00",
            locale: "饮食中心",
            value: -12,
        },
        {
            category: "消费",
            date: "2020-09-14 12:01",
            locale: "饮食中心",
            value: -9,
        },
        {
            category: "消费",
            date: "2020-09-14 07:22",
            locale: "饮食中心",
            value: -4.2,
        },
        {
            category: "消费",
            date: "2020-09-13 18:34",
            locale: "饮食中心",
            value: -15,
        },
        {
            category: "消费",
            date: "2020-09-13 12:19",
            locale: "饮食中心",
            value: -4.5,
        },
        {
            category: "消费",
            date: "2020-09-13 07:22",
            locale: "饮食中心",
            value: -3.1,
        },
        {
            category: "消费",
            date: "2020-09-12 18:03",
            locale: "饮食中心",
            value: -6.8,
        },
        {
            category: "消费",
            date: "2020-09-12 12:17",
            locale: "饮食中心",
            value: -15,
        },
        {
            category: "消费",
            date: "2020-09-12 07:56",
            locale: "饮食中心",
            value: -4,
        },
        {
            category: "消费",
            date: "2020-09-11 18:23",
            locale: "饮食中心",
            value: -6,
        },
        {
            category: "消费",
            date: "2020-09-11 12:04",
            locale: "饮食中心",
            value: -6.7,
        },
        {
            category: "消费",
            date: "2020-09-11 07:56",
            locale: "饮食中心",
            value: -5.2,
        },
        {
            category: "消费",
            date: "2020-09-10 17:21",
            locale: "饮食中心",
            value: -8.4,
        },
        {
            category: "消费",
            date: "2020-09-10 11:37",
            locale: "饮食中心",
            value: -6.5,
        },
        {
            category: "消费",
            date: "2020-09-10 08:36",
            locale: "饮食中心",
            value: -4.5,
        },
        {
            category: "消费",
            date: "2020-09-09 17:54",
            locale: "饮食中心",
            value: -8.8,
        },
        {
            category: "消费",
            date: "2020-09-09 11:27",
            locale: "饮食中心",
            value: -5,
        },
        {
            category: "消费",
            date: "2020-09-08 18:26",
            locale: "饮食中心",
            value: -8.5,
        },
        {
            category: "消费",
            date: "2020-09-08 12:14",
            locale: "饮食中心",
            value: -10,
        },
        {
            category: "消费",
            date: "2020-09-08 08:23",
            locale: "饮食中心",
            value: -3.1,
        },
        {
            category: "消费",
            date: "2020-09-07 17:47",
            locale: "饮食中心",
            value: -8,
        },
        {
            category: "消费",
            date: "2020-09-07 12:04",
            locale: "饮食中心",
            value: -11.61,
        },
        {
            category: "消费",
            date: "2020-09-07 08:02",
            locale: "饮食中心",
            value: -2.3,
        },
        {
            category: "消费",
            date: "2020-09-06 18:28",
            locale: "饮食中心",
            value: -4,
        },
        {
            category: "消费",
            date: "2020-09-06 12:03",
            locale: "饮食中心",
            value: -5.2,
        },
        {
            category: "消费",
            date: "2020-09-06 08:02",
            locale: "饮食中心",
            value: -5.9,
        },
    ],
    300,
    272.11,
    27.89,
] as [Record[], number, number, number];


const basePatterns = [
    [5, 0, 0, 0, 2, 5],
    [0, 0, 0, 5, 0, 5],
    [0, 0, 0, 2, 2, 5],
    [5, 0, 0, 0, 0, 2],
    [5, 0, 0, 2, 2, 0],
    [0, 0, 0, 0, 5, 0],
    [5, 0, 0, 5, 5, 2],
];

const rand = () => Math.floor(Math.random() * basePatterns.length);

const generateWeek = () =>
    basePatterns[rand()]
        .concat(basePatterns[rand()])
        .concat(basePatterns[rand()])
        .concat(basePatterns[rand()])
        .concat(basePatterns[rand()])
        .concat(basePatterns[rand()])
        .concat(basePatterns[rand()]);

const generatedPattern = [
    ["101:240", generateWeek()],
    ["102:40", generateWeek()],
    ["103:40", generateWeek()],
    ["104:240", generateWeek()],
    ["201:150", generateWeek()],
    ["202:40", generateWeek()],
    ["203:40", generateWeek()],
    ["204:40", generateWeek()],
    ["205:150", generateWeek()],
];

export const MOCK_CLASSROOM_STATE = generatedPattern as [string, number[]][];

export const MOCK_LOSE_CARD_CODE = 2;

export const MOCK_BANK_PAYMENT = [{
    month: "2021年12月",
    payment: [{
        department: "024 计算机系",
        project: "1234567890 元宇宙项目开发",
        usage: "勤工俭学",
        description: "",
        bank: "中国银行",
        time: "20771225 15:07:37",
        total: "500.00",
        deduction: "0.00",
        actual: "500.00",
        deposit: "500.00",
        cash: "0.00",
    }, {
        department: "024 计算机系",
        project: "1145142333 学术科技赛事",
        usage: "勤工俭学",
        description: "",
        bank: "中国银行",
        time: "20771211 11:24:51",
        total: "200.00",
        deduction: "0.00",
        actual: "200.00",
        deposit: "200.00",
        cash: "0.00",
    }],
}, {
    month: "2021年10月",
    payment: [{
        department: "999 清华大学",
        project: "100000077 防疫物资专项",
        usage: "医疗费",
        description: "医疗费",
        bank: "中国银行",
        time: "20211024 10:24:28",
        total: "120.00",
        deduction: "0.00",
        actual: "120.00",
        deposit: "120.00",
        cash: "0.00",
    }],
}] as BankPaymentByMonth[];
