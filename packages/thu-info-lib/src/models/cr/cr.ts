export interface CoursePlan {
    id: string;        // 课程号
    name: string;      // 课程名
    property: string;  // 课程属性
    credit: number;    // 学分
    group: string;     // 所属课组
}

export interface SearchParams {
    semester: string    // 学年学期
    id?: string;        // 课程号
    seq?: number;       // 课序号
    name?: string;      // 课程名
    dayOfWeek?: number; // 上课星期（1~7）
    period?: number;    // 上课节次（1~6）
    page?: number;      // 页数
}

export interface CrRemainingInfo {
    id: string;        // 课程号
    seq: number;       // 课序号
    name: string;      // 课程名
    capacity: number;  // 课容量
    remaining: number; // 课余量
    queue: number;     // 队列人数
    teacher: string;   // 任课老师
    time: string;      // 上课时间
}

export interface CrRemainingSearchResult {
    currPage: number;
    totalPage: number;
    totalCount: number;
    courses: CrRemainingInfo[];
}
