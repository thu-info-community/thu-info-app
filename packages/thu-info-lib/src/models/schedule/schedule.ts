import dayjs from "dayjs";

export enum ScheduleType {
	PRIMARY,
	SECONDARY,
	EXAM,
	CUSTOM,
}

export const MAX_WEEK_LIST = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18,
];

export interface TimeSlice {
    dayOfWeek: number,
    beginTime: dayjs.Dayjs,
    endTime: dayjs.Dayjs,
    id?: number,
}

// TimeSlice methods BEGIN

/**
 * 从 dayjs 时间对象计算开始节数
 * @param beginTime dayjs 时间对象
 * @returns 节数（1-14），如果无法匹配则返回 0
 */
export const getBeginPeriod = (beginTime: dayjs.Dayjs): number => {
    const beginTimes = [
        "", "08:00", "08:50", "09:50", "10:40", "11:30",
        "13:30", "14:20", "15:20", "16:10", "17:05", "17:55",
        "19:20", "20:10", "21:00"
    ];
    const timeStr = beginTime.format("HH:mm");
    const index = beginTimes.indexOf(timeStr);
    return index > 0 ? index : 0;
};

/**
 * 从 dayjs 时间对象计算结束节数
 * @param endTime dayjs 时间对象
 * @returns 节数（1-14），如果无法匹配则返回 0
 */
export const getEndPeriod = (endTime: dayjs.Dayjs): number => {
    const endTimes = [
        "", "08:45", "09:35", "10:35", "11:25", "12:15",
        "14:15", "15:05", "16:05", "16:55", "17:50", "18:40",
        "20:05", "20:55", "21:45"
    ];
    const timeStr = endTime.format("HH:mm");
    const index = endTimes.indexOf(timeStr);
    return index > 0 ? index : 0;
};

/**
 * 从 dayjs 时间对象和学期开始日期计算周次
 * @param time dayjs 时间对象
 * @param semesterFirstDay 学期第一天（YYYY-MM-DD格式）
 * @returns 周次（1开始），如果无法计算则返回 0
 */
export const getWeekFromTime = (time: dayjs.Dayjs, semesterFirstDay: string): number => {
    const semesterStart = dayjs(semesterFirstDay);
    const diffDays = time.diff(semesterStart, "day");
    return Math.floor(diffDays / 7) + 1;
};

// TimeSlice methods END

export interface ScheduleTime {
    // 添加新方法时，请始终保持这个数组是有序的、时间块不重叠、不存在相邻未合并时间块的
    // @warning 请勿通过除了 scheduleTimeAdd, scheduleTimeRemove 函数之外的任何方式修改该数组！
    base: TimeSlice[];
}

// ScheduleTime methods BEGIN

/**
 * 给计划时间插入新的时间片，
 * @param time 接受新时间片的计划时间
 * @param elem 需要插入的时间片
 * @param mergeAdjacent 如果发生时间块相邻，则自动合并
 * @return 布尔类型，表示插入是否成功
 */
export const scheduleTimeAdd = (time: ScheduleTime, elem: TimeSlice, mergeAdjacent = false): boolean => {
    let isAdjacent = false;
    // 合并相邻的时间片
    if (mergeAdjacent) {
        for (const val of time.base) {
            if (elem.beginTime.isAfter(val.endTime) && elem.beginTime.diff(val.endTime, "minutes") <= 15) {
                val.endTime = elem.endTime;
                isAdjacent = true;
                break;
            } else if (val.beginTime.isAfter(elem.endTime) && val.beginTime.diff(elem.endTime, "minutes") <= 15) {
                val.beginTime = elem.beginTime;
                isAdjacent = true;
                break;
            }
        }
    }
    if (!isAdjacent) {
        time.base.push(elem);
    }

    return true;
};

/**
 * 从 time.base 中删除一个时间片
 * @param time 需要删除时间片的计划时间
 * @param elem 要删除的时间片
 * @returns 如果删除成功返回 true，否则返回 false
 */
export const scheduleTimeRemove = (time: ScheduleTime, elem: TimeSlice): boolean => {
    const index = time.base.findIndex((slice: TimeSlice) => 
        slice.dayOfWeek === elem.dayOfWeek && 
        slice.beginTime.isSame(elem.beginTime, "minute") && 
        slice.endTime.isSame(elem.endTime, "minute")
    );

    if (index === -1) {
        return false;
    }

    time.base.splice(index, 1);
    return true;
};

// ScheduleTime methods END

export interface Schedule {
    name: string,
    location: string,
    hash: string,
    type: ScheduleType,
    category?: string,
    activeTime: ScheduleTime,
    delOrHideTime: ScheduleTime,
}

/**
 * 用于删除或隐藏某一个时间片
 * @param schedule 需要操作的计划
 * @param elem 需要删除或隐藏的时间片
 * @returns 如果删除成功返回 true，否则返回 false
 * @note 允许传入的 elem 有冗余甚至不存在于活跃时间列表中
 */
export const delOrHide = (schedule: Schedule, elem: TimeSlice): boolean => {
    const removed = scheduleTimeRemove(schedule.activeTime, elem);
    if (removed && schedule.category !== "个人日历" && schedule.type !== ScheduleType.CUSTOM) {
        scheduleTimeAdd(schedule.delOrHideTime, elem);
    }
    return removed;
};

/**
 * 用于取消删除或隐藏某一个时间片
 * @param schedule 需要操作的计划
 * @param elem 需要取消删除或隐藏的时间片
 * @returns 如果取消成功返回 true，否则返回 false
 * @note 允许传入的 elem 有冗余甚至不存在于已删除或隐藏时间列表中
 */
export const removeDelOrHide = (schedule: Schedule, elem: TimeSlice): boolean => {
    const removed = scheduleTimeRemove(schedule.delOrHideTime, elem);
    if (removed) {
        scheduleTimeAdd(schedule.activeTime, elem);
    }
    return removed;
};

/**
 * 合并计划列表中相同的计划，名称和地点相同的计划认为是同一个计划
 * @param base 需要去重的计划列表
 * @returns 返回去重后的计划列表
 */
export const mergeSchedules = (base: Schedule[]) => {
    const existName: string[] = [];
    const processedScheduleList: Schedule[] = [];
    base.forEach((schedule) => {
        const nameLocation = `${schedule.name}.${schedule.location}.${schedule.category}`;
        const index = existName.indexOf(nameLocation);
        if (index === -1) {
            existName.push(nameLocation);
            processedScheduleList.push(schedule);
        } else {
            schedule.activeTime.base.forEach((time) => {
                scheduleTimeAdd(processedScheduleList[index].activeTime, time, schedule.category !== "个人日历");
            });
        }
    });
    return processedScheduleList;
};

/**
 * 给定一个新计划以及一个计划列表，求出计划列表中所有和该新计划发生重叠的时间块
 * @param tester 新计划
 * @param base 计划列表
 * @return 返回类型为 [string, ScheduleType, TimeSlice] 的元组的列表
 *         元组三项的含义分别为计划名称、计划类型、发生重叠的时间块
 */
export const getOverlappedBlock = (
    tester: Schedule,
    base: Schedule[],
): [string, ScheduleType, TimeSlice][] => {
    const res: [string, ScheduleType, TimeSlice][] = [];
    base.forEach((schedule) => {
        schedule.activeTime.base.forEach((a) => {
            tester.activeTime.base.forEach((b) => {
                const overlap =
                    a.endTime >= b.beginTime && a.beginTime <= b.endTime;
                if (overlap) {
                    res.push([
                        schedule.name,
                        schedule.type,
                        a
                    ]);
                }
            });
        });
    });
    return res;
};

export const parseJSON = (json: any[]): Schedule[] => {
    const scheduleList: Schedule[] = [];
    json.forEach((o) => {
        try {
            const current = dayjs(o.nq);
            const dayOfWeek = current.day() === 0 ? 7 : current.day();
            const lessonList = scheduleList.filter((val) => val.name === o.nr && val.location === (o.dd || "") && val.category === o.fl);
            let lesson: Schedule;
            if (lessonList.length) {
                lesson = lessonList[0];
            } else {
                scheduleList.push({
                    name: o.nr,
                    location: o.dd || "",
                    hash: o.nr + "@" +o.dd,
                    type: ScheduleType.PRIMARY,
                    category: o.fl,
                    activeTime: {base: []},
                    delOrHideTime: {base: []}
                });
                lesson = scheduleList[scheduleList.length - 1];
            }
            scheduleTimeAdd(lesson.activeTime, {
                id: o.grrlID,
                dayOfWeek,
                beginTime: dayjs(`${o.nq} ${o.kssj.replace("：", ":")}`),
                endTime: dayjs(`${o.nq} ${o.jssj.replace("：", ":")}`),
            }, lesson.category !== "个人日历");
        } catch (e) {
            console.error(e);
        }
    });
    return scheduleList;
};

export const parseSecondaryWeek = (
    src: string,
    callback: (week: number) => void,
): boolean => {
    let healthy = true;
    src.split(",").forEach((segment) => {
        if (segment.indexOf("-") === -1) {
            const week = Number(segment);
            if (isNaN(week)) {
                healthy = false;
            } else {
                callback(week);
            }
        } else {
            const partials = segment.split("-");
            if (partials.length === 2) {
                const x = Number(partials[0]);
                const y = Number(partials[1]);
                if (isNaN(x) || isNaN(y) || x > y) {
                    healthy = false;
                } else {
                    for (let i = x; i <= y; i++) {
                        callback(i);
                    }
                }
            } else {
                healthy = false;
            }
        }
    });
    return healthy;
};

// Note: no '}' at the end.
export const parseScript = (
    script: string,
    firstDay: string,
    verbose = false,
): Schedule[] | [string, string, boolean][] => {
    const result: Schedule[] = [];
    const verboseResult: [string, string, boolean][] = [];
    const segments = script.split("strHTML =").slice(1);
    const beginList = ["08:00", "09:50", "13:30", "15:20", "17:05", "19:20"];
    const endList = ["09:35", "12:15", "15:05", "16:55", "18:40", "21:45"];
    const reg = /"<span onmouseover=\\"return overlib\('(.+?)'\);\\" onmouseout='return nd\(\);'>(.+?)<\/span>";[ \n\t\r]+?document.getElementById\('(.+?)'\).innerHTML \+= strHTML\+"<br>";/;
    segments.forEach((seg) => {
        reg.test(seg);
        const basic = RegExp.$3;
        const dayOfWeek = Number(basic[3]);
        const sessionIndex = Number(basic[1]);
        const begin = beginList[sessionIndex - 1];
        const end = endList[sessionIndex - 1];
        const title = RegExp.$2;
        const detail = RegExp.$1.replace(/\s/g, "");

        // TODO: ugly resolution, maybe better
        /[^(]+?\(([^，]+?)，.+?/.test(detail);
        const location = RegExp.$1;

        const add = (week: number) => {
            const lessonList = result.filter((val) => val.name === title);
            let lesson: Schedule;
            if (lessonList.length) {
                lesson = lessonList[0];
            } else {
                result.push({
                    name: title,
                    location,
                    hash: title + "@" + location,
                    type: ScheduleType.SECONDARY,
                    activeTime: {base: []},
                    delOrHideTime: {base: []}
                });
                lesson = result[result.length - 1];
            }
            const date = dayjs(firstDay).add((week - 1) * 7 + dayOfWeek - 1, "day").format("YYYY-MM-DD");
            scheduleTimeAdd(lesson.activeTime, {
                dayOfWeek,
                beginTime: dayjs(`${date} ${begin}`),
                endTime: dayjs(`${date} ${end}`),
            });
        };

        if (detail.indexOf("单周") !== -1) {
            [1, 3, 5, 7, 9, 11, 13, 15].forEach(add);
            verboseResult.push([title, "单周", true]);
        } else if (detail.indexOf("双周") !== -1) {
            [2, 4, 6, 8, 10, 12, 14, 16].forEach(add);
            verboseResult.push([title, "双周", true]);
        } else if (detail.indexOf("全周") !== -1) {
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].forEach(add);
            verboseResult.push([title, "全周", true]);
        } else if (
            detail.indexOf("前八周") !== -1 ||
			detail.indexOf("前8周") !== -1
        ) {
            [1, 2, 3, 4, 5, 6, 7, 8].forEach(add);
            verboseResult.push([title, "前八周", true]);
        } else if (
            detail.indexOf("后八周") !== -1 ||
			detail.indexOf("后8周") !== -1
        ) {
            [9, 10, 11, 12, 13, 14, 15, 16].forEach(add);
            verboseResult.push([title, "后八周", true]);
        } else {
            const res = /第([\d\-~,]+)周/.exec(detail);
            if (res !== null && res[1]) {
                const healthy = parseSecondaryWeek(res[1], add);
                verboseResult.push([title, res[1], healthy]);
            } else {
                const resEn = /Week([\d\-~,]+)/i.exec(detail);
                if (resEn !== null && resEn[1]) {
                    const healthy = parseSecondaryWeek(resEn[1], add);
                    verboseResult.push([title, resEn[1], healthy]);
                } else {
                    verboseResult.push([title, detail, false]);
                }
            }
        }
    });
    return verbose ? verboseResult : result;
};

/**
 * 统一的周次模式解析器，支持以下格式：
 * - 范围表达式："8-11周"、"第3,5-7周"、"1-3,5,7-9"
 * - 特殊关键词："全周"、"单周"、"双周"、"前八周"/"前8周"、"后八周"/"后8周"
 * @param pattern  周次描述字符串
 * @param weekCount  学期总周数（用于"全周"、"后八周"等需要知道总周数的模式）
 * @returns  排序去重后的周次数组
 */
export const parseWeekPattern = (pattern: string, weekCount: number): number[] => {
    const normalized = pattern.replace(/第|周/g, "").trim();
    if (normalized.length === 0) {
        return [];
    }

    // 全周（normalized 后为 "全"）
    if (normalized === "全") {
        return Array.from({length: weekCount}, (_, i) => i + 1);
    }
    // 单周（normalized 后为 "单"）
    if (normalized === "单") {
        return Array.from({length: weekCount}, (_, i) => i + 1).filter((w) => w % 2 === 1);
    }
    // 双周（normalized 后为 "双"）
    if (normalized === "双") {
        return Array.from({length: weekCount}, (_, i) => i + 1).filter((w) => w % 2 === 0);
    }
    // 前八周 / 前8周（normalized 后为 "前八" / "前8"）
    if (/^前(?:八|8)$/.test(normalized)) {
        return Array.from({length: Math.min(8, weekCount)}, (_, i) => i + 1);
    }
    // 后八周 / 后8周（normalized 后为 "后八" / "后8"）
    if (/^后(?:八|8)$/.test(normalized)) {
        const start = Math.max(1, weekCount - 7);
        return Array.from({length: weekCount - start + 1}, (_, i) => start + i);
    }

    // 兜底：逗号分隔的范围表达式
    const weeks: number[] = [];
    parseSecondaryWeek(normalized, (w) => weeks.push(w));
    return [...new Set(weeks)].sort((a, b) => a - b);
};

/**
 * 解析 CR 选课系统的一级课表页面（m=kbSearch），
 * 提取 setInitValue 函数中的课程安排数据。
 *
 * CR 系统的 setInitValue 结构：
 * ```
 * strHTML = "";
 * var strHTML1 = "";
 * strHTML += "...<b>课程名</b>..."
 * strHTML1 += "；教师"
 * strHTML1 += "；课程属性"
 * strHTML1 += "；周次模式"
 * strHTML1 += "；上课地点"
 * getElementById('a{session}_{day}').innerHTML += strHTML+"<br>";
 * ```
 *
 * @param html  CR kbSearch 页面的完整 HTML
 * @param firstDay  学期第一天（YYYY-MM-DD）
 * @param weekCount  学期总周数
 * @returns  解析后的 Schedule[]
 */
export const parseCRSchedule = (
    html: string,
    firstDay: string,
    weekCount: number,
): Schedule[] => {
    // session → [beginTime, endTime] 映射（a1～a6）
    const sessionTimes: [string, string][] = [
        ["", ""],
        ["08:00", "09:35"],   // a1: 第1节
        ["09:50", "12:15"],   // a2: 第2节
        ["13:30", "15:05"],   // a3: 第3节
        ["15:20", "16:55"],   // a4: 第4节
        ["17:05", "18:40"],   // a5: 第5节
        ["19:20", "21:45"],   // a6: 第6节
    ];

    const scheduleList: Schedule[] = [];

    // 定位 setInitValue 函数体
    const funcStart = html.indexOf("function setInitValue");
    if (funcStart === -1) {
        return [];
    }
    const funcEnd = html.indexOf("initTopLocal", funcStart);
    if (funcEnd === -1) {
        return [];
    }
    const body = html.substring(funcStart, funcEnd);

    // 匹配每个课程时间槽赋值块：
    // strHTML = ""; var strHTML1 = ""; ...(课程名+详情)... getElementById('a{session}_{day}')
    const blockRegex =
        /strHTML\s*=\s*"";\s+var strHTML1\s*=\s*"";([\s\S]*?)getElementById\('a(\d+)_(\d+)'\)/g;

    let match: RegExpExecArray | null;
    while ((match = blockRegex.exec(body)) !== null) {
        try {
            const blockContent = match[1];
            const session = parseInt(match[2], 10);
            const dayOfWeek = parseInt(match[3], 10);

            // 提取课程名
            const nameMatch = /<b>(.+?)<\/b>/.exec(blockContent);
            if (!nameMatch) {
                continue;
            }
            const name = nameMatch[1];

            // 提取 strHTML1 各行中的分号分隔字段
            const fields: string[] = [];
            const fieldRegex = /strHTML1\s*\+=\s*["']；(.+?)["']/g;
            let fieldMatch: RegExpExecArray | null;
            while ((fieldMatch = fieldRegex.exec(blockContent)) !== null) {
                fields.push(fieldMatch[1]);
            }

            if (fields.length < 3) {
                // 至少需要：教师、课程属性、周次模式
                continue;
            }

            const category = fields[1];                     // 必修/限选/任选
            const weekPattern = fields[2];                  // 8-11周 / 全周 / 单周...
            const location = fields.length >= 4 ? fields[3] : "";

            // 解析周次
            const weeks = parseWeekPattern(weekPattern, weekCount);
            if (weeks.length === 0) {
                continue;
            }

            // session 有效性检查
            if (session < 1 || session > 6) {
                continue;
            }
            const [begin, end] = sessionTimes[session];

            // 查找或创建 Schedule（按 name + location + category 分组）
            const hash = name + "@" + location;
            let lesson = scheduleList.find(
                (s) => s.hash === hash && s.category === category,
            );
            if (!lesson) {
                scheduleList.push({
                    name,
                    location,
                    hash,
                    type: ScheduleType.PRIMARY,
                    category,
                    activeTime: {base: []},
                    delOrHideTime: {base: []},
                });
                lesson = scheduleList[scheduleList.length - 1];
            }

            // 为每个周次生成 TimeSlice
            for (const week of weeks) {
                const date = dayjs(firstDay)
                    .add((week - 1) * 7 + dayOfWeek - 1, "day")
                    .format("YYYY-MM-DD");
                scheduleTimeAdd(
                    lesson.activeTime,
                    {
                        dayOfWeek,
                        beginTime: dayjs(`${date} ${begin}`),
                        endTime: dayjs(`${date} ${end}`),
                    },
                    true,  // mergeAdjacent: CR 同一门课多天分开展示
                );
            }
        } catch {
            // 单条解析失败不影响其他课程
        }
    }

    return scheduleList;
};
