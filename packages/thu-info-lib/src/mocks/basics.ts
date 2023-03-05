import {Form, InputTag, Overall, Person} from "../models/home/assessment";
import {Record} from "../models/home/expenditure";
import {BankPaymentByMonth} from "../models/home/bank";
import {CalendarData} from "../models/schedule/calendar";
import {Invoice} from "../models/home/invoice";
import {ClassroomStateResult} from "../models/home/classroom";

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
] as Record[];

export const MOCK_CLASSROOM_LIST = [
    { name: "建馆", weekNumber: 1, searchName: "建馆" },
    { name: "西阶", weekNumber: 1, searchName: "西阶" },
    { name: "东阶", weekNumber: 1, searchName: "东阶" },
    { name: "工物馆", weekNumber: 1, searchName: "工物馆" },
    { name: "理科楼", weekNumber: 1, searchName: "理科楼" },
    { name: "旧水", weekNumber: 1, searchName: "旧水" },
    { name: "新水", weekNumber: 1, searchName: "新水" },
    { name: "文北楼", weekNumber: 1, searchName: "文北楼" },
    { name: "旧经管报告厅", weekNumber: 1, searchName: "旧经管报告厅" },
    { name: "明理楼", weekNumber: 1, searchName: "明理楼" },
    { name: "一教", weekNumber: 1, searchName: "一教" },
    { name: "二教", weekNumber: 1, searchName: "二教" },
    { name: "三教", weekNumber: 1, searchName: "三教" },
    { name: "四教", weekNumber: 1, searchName: "四教" },
    { name: "五教", weekNumber: 1, searchName: "五教" },
    { name: "六教", weekNumber: 1, searchName: "六教" },
    { name: "经管伟伦楼", weekNumber: 1, searchName: "经管伟伦楼" },
    { name: "技科楼", weekNumber: 1, searchName: "技科楼" },
    { name: "清华学堂", weekNumber: 1, searchName: "清华学堂" },
    { name: "美院", weekNumber: 1, searchName: "美院" },
    { name: "中央主楼开放实验室", weekNumber: 1, searchName: "中央主楼开放实验室" },
    { name: "生命科学馆", weekNumber: 1, searchName: "生命科学馆" },
    { name: "蒙楼(艺教)", weekNumber: 1, searchName: "蒙楼(艺教)" },
    { name: "逸夫图书馆", weekNumber: 1, searchName: "逸夫图书馆" },
    { name: "主楼", weekNumber: 1, searchName: "主楼" },
    { name: "建华楼研讨间", weekNumber: 1, searchName: "建华楼研讨间" },
    { name: "建华楼", weekNumber: 1, searchName: "建华楼" },
    { name: "舜德楼", weekNumber: 1, searchName: "舜德楼" },
    { name: "集成电路学院", weekNumber: 1, searchName: "集成电路学院" },
    { name: "李兆基科技大楼", weekNumber: 1, searchName: "李兆基科技大楼" },
    { name: "廖凯原楼(法图)", weekNumber: 1, searchName: "廖凯原楼(法图)" },
    { name: "文南楼", weekNumber: 1, searchName: "文南楼" },
    { name: "何添楼", weekNumber: 1, searchName: "何添楼" },
    { name: "罗姆楼", weekNumber: 1, searchName: "罗姆楼" },
    { name: "蒙民伟科技", weekNumber: 1, searchName: "蒙民伟科技" },
    { name: "环境学院", weekNumber: 1, searchName: "环境学院" }
];

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

export const MOCK_CLASSROOM_STATE: ClassroomStateResult = {
    validWeekNumbers: [1, 2, 3, 4, 5, 6],
    currentWeekNumber: 1,
    datesOfCurrentWeek: ["02.20", "02.21", "02.22", "02.23", "02.24", "02.25", "02.26"],
    classroomStates: [
        {name: "101:240", status: generateWeek()},
        {name: "102:40", status: generateWeek()},
        {name: "103:40", status: generateWeek()},
        {name: "104:240", status: generateWeek()},
        {name: "201:150", status: generateWeek()},
        {name: "202:40", status: generateWeek()},
        {name: "203:40", status: generateWeek()},
        {name: "204:40", status: generateWeek()},
        {name: "205:150", status: generateWeek()},
    ],
};

export const MOCK_LOSE_CARD_CODE = 2;

export const SAMPLE_INVOICE_BASE64 = "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K5xXJCoxtixMAaWkyiAlc7zPnO5OZ/imp9qjMZL2Y4xc7lxY9/Xw0zjKogEp45HVkbSvMCWLJyVyjycOfP9+fX3dfF7PVt7jzuHz7qz9LPx8eDX71WNb6y7rc2t4jXrIET/jwNWPhltbHxRs7dJJy5Ps6GoSTpBPcYIUUNh/9zQxTWkQixQlp1s/UZI5VFxiuqxLpasiu6rbGFFrmtRlQvc1CY7udl82zxbdcvrH9vVW5FTmT3SP947LmRczxz7XcVXijNQbYm603xh7s3NxdkPOStEYs8beGLvOuSJ7ec6d9qbYpqSsnGyHPUb1ZHbJyjCbNEVwjeVkd4UMCzgj7w544nQy5TmZm41k9WwBW880FmJBf05eVlayULPyLBm+9EstPurBeqQXenzxzBc/Vjourc+06HoefgqblbGgT38J550uO+1srTsFfBkXn1ISl2KctAws4qluIatbmFCcxYsK+0e8mN3N5+vXt3//osLk5BSTz+ftqiUlpiQrKcnJSYma5u2a7Zv0iH3yczfP3z1m5KRB4XmjZs+85YsN93y3Uj0Uu/eB4I6SAez1msCNK8/97kj4n5vZa85r1k0Y0lBROdObMiW3+J4Z85+YPvvFZY7bbl92xYiiorndBz28ZPHxhkU41P8LahH+MA0KZW5kc3RyZWFtDWVuZG9iag0yIDAgb2JqDTw8L0NvdW50IDEgL0tpZHMgWzYgMCBSXSAvVHlwZSAvUGFnZXM+Pg1lbmRvYmoNNCAwIG9iag08PC9OYW1lcyBbXT4+DWVuZG9iag01IDAgb2JqDTw8Pj4NZW5kb2JqDXhyZWYNCjAgMTUNCjAwMDAwMDAwMDAgNjU1MzUgZg0KMDAwMDAwMDAxNiAwMDAwMCBuDQowMDAwMDEwNDEyIDAwMDAwIG4NCjAwMDAwMDAxMDMgMDAwMDAgbg0KMDAwMDAxMDQ2NyAwMDAwMCBuDQowMDAwMDEwNDk2IDAwMDAwIG4NCjAwMDAwMDA0MzYgMDAwMDAgbg0KMDAwMDAwMDU4MyAwMDAwMCBuDQowMDAwMDAwMzY1IDAwMDAwIG4NCjAwMDAwMDA4MzAgMDAwMDAgbg0KMDAwMDAwMDk2OSAwMDAwMCBuDQowMDAwMDAxMzg0IDAwMDAwIG4NCjAwMDAwMDE2MTUgMDAwMDAgbg0KMDAwMDAwMTkyMyAwMDAwMCBuDQowMDAwMDAxMzExIDAwMDAwIG4NCnRyYWlsZXI8PC9TaXplIDE1IC9Sb290IDEgMCBSIC9JbmZvIDMgMCBSIC9JRCBbPGVmMTU0NmI3MjQ1NjQ2MDQ4NWQ3ODA4YTMxN2RmNzNjPjwyM2Q1MjM5ZTA3YjM0OWE2YmRkZmUyOTQ3MjQwMGM1NT5dPj4Nc3RhcnR4cmVmDTEwNTE2DSUlRU9GDQ==";

export const MOCK_INVOICE_LIST = [{
    bill_amount: 15,
    bmdm: "000",
    bus_no: "2022031388888888888",
    cust_email: "dzpj@tsinghua.edu.cn",
    cust_mob: "",
    cust_name: "清华大学教育基金会",
    cust_tax_no: "",
    cust_ts_cardno: "8888",
    cust_type: "1",
    file_name: "",
    financial_dept_name: "体育部",
    financial_item_name: "西体场地费",
    inv_amount: 15,
    inv_code: "",
    inv_crc: "2333",
    inv_data_id: 123456,
    inv_date: "2022-03-13",
    inv_isred: "0",
    inv_no: "8888888888",
    inv_note: "2022-03-16西体育馆 台1",
    inv_red_no: "",
    inv_type: "D101",
    inv_typeStr: "清华大学校内结算凭证（电子）",
    is_allow_reimbursement: "1",
    ists: "0",
    payment_item_type_name: "场地费",
    red_bus_no: "",
    tax_amount: 0
},
{
    bill_amount: 15,
    bmdm: "000",
    bus_no: "2022031288888888888",
    cust_email: "dzpj@tsinghua.edu.cn",
    cust_mob: "",
    cust_name: "undefined",
    cust_tax_no: "",
    cust_ts_cardno: "8888",
    cust_type: "1",
    file_name: "",
    financial_dept_name: "体育部",
    financial_item_name: "西体场地费",
    inv_amount: 15,
    inv_code: "",
    inv_crc: "2333",
    inv_data_id: 654321,
    inv_date: "2022-03-12",
    inv_isred: "0",
    inv_no: "8888888888",
    inv_note: "2022-03-15西体育馆 台6",
    inv_red_no: "",
    inv_type: "D101",
    inv_typeStr: "清华大学校内结算凭证（电子）",
    is_allow_reimbursement: "1",
    ists: "0",
    payment_item_type_name: "场地费",
    red_bus_no: "",
    tax_amount: 0
}] as Invoice[];

export const MOCK_INVOICE_DATA = {
    data: MOCK_INVOICE_LIST,
    count: MOCK_INVOICE_LIST.length,
};

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

export const MOCK_CALENDAR_DATA: CalendarData = {
    firstDay: "2023-02-20",
    semesterId: "2022-2023-2",
    weekCount: 18,
};

export const MOCK_COUNTDOWN_DATA = [
    "距22-23秋 本科生预选 开始还有5天",
    "距21-22夏 本研选课 开始还有13天",
    "距22-23秋 本科生正选 开始还有14天",
];

