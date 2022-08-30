export const MOCK_PROGRAM = {
    completedCredit: 149,
    compulsoryCredit: 73,
    restrictedCredit: 74,
    electiveCredit: 13,
    duplicatedCourse: [],
    courseSet: [
        {
            setName: "体育必修",
            type: 0,
            course: [
                {
                    id: "10720011",
                    name: "体育(1)",
                    credit: 1,
                    point: 1.6,
                    grade: "D+",
                    state: 0
                },
                {
                    id: "10720021",
                    name: "体育(2)",
                    credit: 1,
                    point: 4,
                    grade: "A-",
                    state: 0
                },
                {
                    id: "10720031",
                    name: "体育(3)",
                    credit: 1,
                    point: 3.3,
                    grade: "B",
                    state: 0
                },
                {
                    id: "10720041",
                    name: "体育(4)",
                    credit: 1,
                    point: 2,
                    grade: "C-",
                    state: 0
                },
                {
                    id: "10720110",
                    name: "体育专项(1)",
                    credit: 0,
                    point: 2,
                    grade: "C-",
                    state: 0
                },
                {
                    id: "10720120",
                    name: "体育专项(2)",
                    credit: 0,
                    point: 3.6,
                    grade: "B+",
                    state: 0
                },
                {
                    id: "10720150",
                    name: "游泳测试",
                    credit: 0,
                    grade: "P",
                    state: 0
                }
            ],
            requiredCredit: 4,
            completedCredit: 4,
            requiredCourseNum: 7,
            completedCourseNum: 7,
            fullCompleted: true
        },
        {
            setName: "英语必修课组",
            type: 0,
            course: [
                {
                    id: "14201082",
                    name: "英语阅读写作（A）",
                    credit: 2,
                    point: 4,
                    grade: "A",
                    state: 0
                },
                {
                    id: "14201092",
                    name: "英语听说交流（A）",
                    credit: 2,
                    point: 4,
                    grade: "A-",
                    state: 0
                },
            ],
            requiredCredit: 4,
            completedCredit: 4,
            completedCourseNum: 2,
            fullCompleted: true
        },
        {
            setName: "专业主修",
            type: 0,
            course: [
                {
                    id: "30240042",
                    name: "人工智能导论",
                    credit: 2,
                    point: 4,
                    grade: "A-",
                    state: 0
                },
                {
                    id: "30240163",
                    name: "软件工程",
                    credit: 3,
                    point: 3.6,
                    grade: "B+",
                    state: 0
                },
                {
                    id: "30240184",
                    name: "数据结构",
                    credit: 4,
                    point: 4,
                    grade: "A-",
                    state: 0
                },
                {
                    id: "30240243",
                    name: "操作系统",
                    credit: 3,
                    grade: "P",
                    state: 0
                },
                {
                    id: "30240382",
                    name: "编译原理",
                    credit: 2,
                    point: 4,
                    grade: "A",
                    state: 0
                },
                {
                    id: "30240551",
                    name: "数字逻辑实验",
                    credit: 1,
                    point: 4,
                    grade: "A",
                    state: 0
                },
                {
                    id: "40240354",
                    name: "计算机组成原理",
                    credit: 4,
                    point: 3.3,
                    grade: "B",
                    state: 0
                },
                {
                    id: "40240432",
                    name: "形式语言与自动机",
                    credit: 2,
                    point: 3.6,
                    grade: "B+",
                    state: 0
                },
                {
                    id: "40240443",
                    name: "计算机系统结构",
                    credit: 3,
                    grade: "P",
                    state: 0
                },
                {
                    id: "40240513",
                    name: "计算机网络原理",
                    credit: 3,
                    point: 3.3,
                    grade: "B",
                    state: 0
                }
            ],
            requiredCredit: 27,
            completedCredit: 27,
            requiredCourseNum: 10,
            completedCourseNum: 10,
            fullCompleted: true
        },
        {
            setName: "数学基础必修—微积分1",
            type: 0,
            course: [
                {
                    id: "10421055",
                    name: "微积分A(1)",
                    credit: 5,
                    point: 4,
                    grade: "A",
                    state: 0
                },
                {
                    id: "10421305",
                    name: "微积分A(1)(英)",
                    credit: 5,
                    state: 2
                }
            ],
            requiredCredit: 5,
            completedCredit: 5,
            requiredCourseNum: 1,
            completedCourseNum: 1,
            fullCompleted: true
        },
        {
            setName: "留学生汉语基础课",
            type: 1,
            course: [],
            completedCredit: 0,
            completedCourseNum: 0,
            fullCompleted: true
        },
        {
            setName: "基础读写(R&W)认证课",
            type: 1,
            course: [
                {
                    id: "00691153",
                    name: "不朽的艺术：走进大师与经典",
                    credit: 3,
                    point: 4,
                    grade: "A",
                    state: 0
                }
            ],
            completedCredit: 3,
            requiredCourseNum: 1,
            completedCourseNum: 1,
            fullCompleted: true
        },
        {
            setName: "自主发展课程-专业限选",
            type: 1,
            course: [
                {
                    id: "30240192",
                    name: "高性能计算导论",
                    credit: 2,
                    grade: "W",
                    state: 2
                },
                {
                    id: "30240422",
                    name: "数据库专题训练",
                    credit: 2,
                    grade: "W",
                    state: 2
                },
                {
                    id: "40240372",
                    name: "信息检索",
                    credit: 2,
                    state: 1
                },
                {
                    id: "40240422",
                    name: "计算机图形学基础",
                    credit: 2,
                    point: 4,
                    grade: "A-",
                    state: 0
                },
                {
                    id: "40240462",
                    name: "现代控制技术",
                    credit: 2,
                    state: 1
                },
                {
                    id: "40240492",
                    name: "数据挖掘",
                    credit: 2,
                    point: 4,
                    grade: "A-",
                    state: 0
                },
                {
                    id: "40240552",
                    name: "嵌入式系统",
                    credit: 2,
                    state: 1
                },
                {
                    id: "40240572",
                    name: "计算机网络安全技术",
                    credit: 2,
                    point: 4,
                    grade: "A",
                    state: 0
                },
                {
                    id: "40240762",
                    name: "搜索引擎技术基础",
                    credit: 2,
                    point: 4,
                    grade: "A",
                    state: 0
                },
                {
                    id: "40240892",
                    name: "现代密码学",
                    credit: 2,
                    point: 4,
                    grade: "A",
                    state: 0
                },
                {
                    id: "40240963",
                    name: "量子计算研讨课",
                    credit: 3,
                    grade: "W",
                    state: 2
                },
                {
                    id: "41120012",
                    name: "无线移动网络技术",
                    credit: 2,
                    point: 3.6,
                    grade: "B+",
                    state: 0
                }
            ],
            requiredCredit: 16,
            completedCredit: 12,
            completedCourseNum: 6,
            fullCompleted: false
        },
        {
            setName: "方案外课程",
            type: 3,
            course: [
                {
                    id: "30240282",
                    name: "计算机科学导论",
                    credit: 2,
                    grade: "P",
                    state: 0
                },
                {
                    id: "00240212",
                    name: "计算科学与生涯规划",
                    credit: 2,
                    point: 3.6,
                    grade: "B+",
                    state: 0
                },
                {
                    id: "02070012",
                    name: "党的知识概论",
                    credit: 2,
                    grade: "P",
                    state: 0
                }
            ],
            completedCredit: 6,
            fullCompleted: false
        }
    ]
};