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
