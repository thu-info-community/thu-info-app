import dayjs from "dayjs";

export enum ScheduleType {
	PRIMARY,
	SECONDARY,
	EXAM,
	CUSTOM,
}

const beginMap: {[key: string]: number} = {
    "08:00": 1,
    "08:50": 2,
    "09:50": 3,
    "10:40": 4,
    "11:30": 5,
    "13:30": 6,
    "14:20": 7,
    "15:20": 8,
    "16:10": 9,
    "17:05": 10,
    "17:55": 11,
    "19:20": 12,
    "20:10": 13,
    "21:00": 14,
};

const endMap: {[key: string]: number} = {
    "08:45": 1,
    "09:35": 2,
    "10:35": 3,
    "11:25": 4,
    "12:15": 5,
    "14:15": 6,
    "15:05": 7,
    "16:05": 8,
    "16:55": 9,
    "17:50": 10,
    "18:40": 11,
    "20:05": 12,
    "20:55": 13,
    "21:45": 14,
};

const examBeginMap: {[key: string]: number} = {
    "9:00": 2,
    "2:30": 7,
    "14:30": 7,
    "7:00": 12,
    "19:00": 12,
};

const examEndMap: {[key: string]: number} = {
    "11:00": 4,
    "4:30": 9,
    "16:30": 9,
    "9:00": 13,
    "21:00": 13,
};

export const MAX_WEEK_LIST = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    11, 12, 13, 14, 15, 16, 17, 18,
];

/**
 * 区分两个概念。
 * 时间块：指的是指明星期数、周几、从第几节开始到第几节结束的一段时间。
 * 时间片：指的是给定周几、从第几节开始到第几节结束后，额外指定在哪些星期活跃的几段时间。
 * - 可以用仅有某一周活跃的时间片表示一个时间块
 */
export interface TimeSlice {
    dayOfWeek: number,
    begin: number,
    end: number,
    activeWeeks: number[], // 请尽量保持该数组有序
}

// TimeSlice methods BEGIN

/**
 * 确定两个时间片发生时间块重叠的星期数
 * @param slice 一个时间片
 * @param other 另一个时间片
 * @return 数字数组，表示发生重叠的星期数
 */
export const overlappedWeeks = (slice: TimeSlice, other: TimeSlice): number[] => {
    if (slice.dayOfWeek === other.dayOfWeek && !(
        slice.end < other.begin || slice.begin > other.end
    )) {
        return (
            slice.activeWeeks.filter((week) => other.activeWeeks.indexOf(week) > -1)
        );
    } else {
        return [];
    }
};

/**
 * 确定两个时间片发生时间块相邻的星期数
 * @param slice 一个时间片
 * @param other 另一个时间片
 * @return 数字数组，表示发生相邻的星期数
 */
export const adjacentWeeks = (slice: TimeSlice, other: TimeSlice): number[] => {
    if (slice.dayOfWeek === other.dayOfWeek && (
        slice.end + 1 === other.begin ||
            other.end + 1 === slice.begin
    )) {
        return (
            slice.activeWeeks.filter((week) => other.activeWeeks.indexOf(week) > -1)
        );
    } else {
        return [];
    }
};

/**
 * 时间块的比较函数
 * 不考虑 activeWeeks，其余三个属性优先级从高到低是 dayOfWeek > begin > end
 * @param slice 一个时间片
 * @param other 另一个时间块
 * @returns 数字类型，负数表示前者小，正数表示前者大，零表示相等
 */
export const timeSliceComp = (slice: TimeSlice, other: TimeSlice): number => {
    const a: number = 10000 * slice.dayOfWeek + 100 * slice.begin + slice.end;
    const b: number = 10000 * other.dayOfWeek + 100 * other.begin + other.end;
    return a - b;
};

// TimeSlice methods END

export interface ScheduleTime {
    // 添加新方法时，请始终保持这个数组是有序的、时间块不重叠、不存在相邻未合并时间块的
    // @warning 请勿通过除了 scheduleTimeAdd, scheduleTimeRemove 函数之外的任何方式修改该数组！
    base: TimeSlice[];
}

// ScheduleTime methods BEGIN

/**
 * 为 time.base 连接上新的时间片列表，不对外开放
 * 完成连接之后会清洗 time.base，保证其有序、时间块不重叠、不存在相邻未合并时间块
 * @param time 接受新时间片的列表
 * @param newList 需要合并到 time.base 的列表
 */
const wrappedConcat = (time: ScheduleTime, newList: TimeSlice[]): void => {
    time.base = time.base.concat(newList);
    time.base.sort((a, b) => timeSliceComp(a, b)); // 排序

    // 注意到合并操作可能会产生起止时间相同但是 activeWeeks 不交且未合并的时间片
    // 此处在有序性的基础上合并
    const mergedList: TimeSlice[] = [];
    time.base.forEach((val) => {
        if (!mergedList.length) {
            mergedList.push(val);
            return;
        }

        const tail: TimeSlice = mergedList[mergedList.length - 1];
        if (tail.begin === val.begin && tail.end === val.end) {
            tail.activeWeeks = tail.activeWeeks.concat(val.activeWeeks);
            tail.activeWeeks.sort((a, b) => a - b);
        } else {
            mergedList.push(val);
        }
    });

    time.base = mergedList;
};

/**
 * 查询该计划时间在给定的星期是否有安排
 * @param time 计划时间
 * @param week 要查询的星期数
 * @returns 布尔值，表示是否安排
 */
export const activeWeek = (time: ScheduleTime, week: number): boolean => {
    return time.base.reduce((prev: boolean, curr: TimeSlice) => (
        prev || (curr.activeWeeks.indexOf(week) > -1)
    ), false);
};

/**
 * 给计划时间插入新的时间片，如果发生时间块相邻，则自动合并
 * @note 必须保证插入的时间块和已有的不重叠，若重叠，插入失败
 * @param time 接受新时间片的计划时间
 * @param elem 需要插入的时间片
 * @return 布尔类型，表示插入是否成功
 */
export const scheduleTimeAdd = (time: ScheduleTime, elem: TimeSlice): boolean => {
    const overlap: boolean = time.base.reduce((prev: boolean, curr: TimeSlice) => (
        prev || (overlappedWeeks(elem, curr).length > 0)
    ), false);

    if (overlap) {
        return false;
    }

    // 对 base 为空特殊处理，否则下面的 forEach 失效
    if (time.base.length === 0) {
        time.base.push(elem);
        return true;
    }

    // 初始化合并记录，将原 time.base 中可以和 elem 合并的记录到其中
    // mergeRecord[2] = [1, 2] 表示合并后第 3 周的某一天 elem 从当天第 1 节持续到第 2 节
    // 合并记录不记录 dayOfWeek
    const mergeRecord: [number, number][] = MAX_WEEK_LIST.map(() => [-1, -1]);
    elem.activeWeeks.forEach((val) => mergeRecord[val - 1] = [elem.begin, elem.end]);

    for (let i = 0; i < 18; ++i) {
        const week: number = i + 1;

        // 遍历所有在第 week 周活跃的时间片
        time.base
            .filter((val) => val.activeWeeks.indexOf(week) > -1)
            .forEach((val) => {
                const weeks: number[] = adjacentWeeks(val, elem);
                if (!weeks.length || weeks.indexOf(week) === -1) return;
                    
                // 取出这些时间片中与 elem 在这一周相邻的并将其合并
                mergeRecord[i] = [
                    val.begin < mergeRecord[i][0] ? val.begin : mergeRecord[i][0],
                    val.end > mergeRecord[i][1] ? val.end : mergeRecord[i][1]
                ];

                // 更新 time.base 中的 activeWeeks 记录
                val.activeWeeks = val.activeWeeks.filter((w) => w != week);
            });
    }

    // 根据合并记录计算需要 TimeSlice
    const newTimeSlice: TimeSlice[] = [];
    mergeRecord.forEach((val, ind) => {
        const week: number = ind + 1;

        // 查找同样起止时间的合并记录是否已经构建了时间片
        let index = 0;
        for (; index < newTimeSlice.length; ++index) {
            const slice = newTimeSlice[index];
            if (slice.begin === val[0] && slice.end === val[1]) {
                // 如果已经构建，则将星期数增添进列表
                slice.activeWeeks.push(week);
                break;
            }
        }

        // 如果没有构建，则新构建一个时间片，注意 -1 表示的是无效合并记录
        if (index === newTimeSlice.length && val[0] > 0 && val[1] > 0) {
            newTimeSlice.push({
                dayOfWeek: elem.dayOfWeek,
                begin: val[0], 
                end: val[1],
                activeWeeks:[week]
            });
        }
    });

    // 合并操作可能导致部分时间片活跃星期消失，将这些时间片删去
    time.base = time.base.filter((val) => val.activeWeeks.length > 0);
    wrappedConcat(time, newTimeSlice); // 合并

    return true;
};

/**
 * 从 time.base 中删除一个时间片
 * @param time 需要删除时间片的计划时间
 * @param elem 要删除的时间片
 * @note 本函数实际是保证操作后的 time.base 中对应的时间片的 activeWeeks 不包含 elem 中所指定的星期数
 *       所以 elem 的 activeWeeks 可以冗余
 * @returns 实际上 time.base 中对应的时间片中 activeWeeks 被删除掉的星期数构成的列表
 *          如果删除失败（time.base 中没有 elem 对应的时间片），返回空列表
 */
export const scheduleTimeRemove = (time: ScheduleTime, elem: TimeSlice): number[] => {
    let index = 0;
    for (; index < time.base.length; ++index) {
        const slice: TimeSlice = time.base[index];
        if (slice.begin === elem.begin && slice.end === elem.end) {
            break;
        }
    }

    if (index === time.base.length) {
        return [];
    }

    const removedWeeks: number[] = [];
    const remainWeeks: number[] = [];
    time.base[index].activeWeeks.forEach((val) => {
        if (elem.activeWeeks.indexOf(val) === -1) {
            remainWeeks.push(val);
        } else {
            removedWeeks.push(val);
        }
    });
    time.base[index].activeWeeks = remainWeeks;

    // 删除操作可能导致部分时间片活跃星期消失，将这些时间片删去
    time.base = time.base.filter((val) => val.activeWeeks.length > 0);

    return removedWeeks;
};

// ScheduleTime methods END

export interface Schedule {
    name: string,
    location: string,
    type: ScheduleType,
    activeTime: ScheduleTime,
    delOrHideTime: ScheduleTime,
}

/**
 * 用于删除或隐藏某一个时间片
 * @param schedule 需要操作的计划
 * @param elem 需要删除或隐藏的时间片
 * @returns 实际删除或隐藏的星期数列表
 * @note 允许传入的 elem 有冗余甚至不存在于活跃时间列表中
 */
export const delOrHide = (schedule: Schedule, elem: TimeSlice): number[] => {
    const weeks: number[] = scheduleTimeRemove(schedule.activeTime, elem);
    scheduleTimeAdd(schedule.delOrHideTime, {
        ...elem,
        activeWeeks: weeks
    });
    return weeks;
};

/**
 * 用于取消删除或隐藏某一个时间片
 * @param schedule 需要操作的计划
 * @param elem 需要取消删除或隐藏的时间片
 * @returns 实际取消删除或隐藏的星期数列表
 * @note 允许传入的 elem 有冗余甚至不存在于已删除或隐藏时间列表中
 */
export const removeDelOrHide = (schedule: Schedule, elem: TimeSlice): number[] => {
    const weeks: number[] = scheduleTimeRemove(schedule.delOrHideTime, elem);
    scheduleTimeAdd(schedule.activeTime, {
        ...elem,
        activeWeeks: weeks
    });
    return weeks;
};

/**
 * 合并计划列表中相同的计划，名称相同的计划认为是同一个计划
 * @param base 需要去重的计划列表
 * @returns 返回去重后的计划列表
 */
export const mergeSchedules = (base: Schedule[]) => {
    const existName: string[] = [];
    const processedScheduleList: Schedule[] = [];
    base.forEach((schedule) => {
        const index = existName.indexOf(schedule.name);
        if (index === -1) {
            existName.push(schedule.name);
            processedScheduleList.push(schedule);
        } else {
            schedule.activeTime.base.forEach((time) => {
                scheduleTimeAdd(processedScheduleList[index].activeTime, time);
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
 * @note 由于这里判定冲突的量级是时间块而不是时间片，所以 TimeSlice 的 activeWeeks 必然只有一项
 */
export const getOverlappedBlock = (
    tester: Schedule,
    base: Schedule[],
): [string, ScheduleType, TimeSlice][] => {
    const res: [string, ScheduleType, TimeSlice][] = [];
    base.forEach((schedule) => {
        schedule.activeTime.base.forEach((a) => {
            tester.activeTime.base.forEach((b) => {
                const weeks: number[] = overlappedWeeks(a, b);
                weeks.forEach((week) => res.push([
                    schedule.name,
                    schedule.type,
                    {...a, activeWeeks: [week]}
                ]));
            });
        });
    });
    return res;
};

export const parseJSON = (json: any[], firstDay: string): Schedule[] => {
    const scheduleList: Schedule[] = [];
    json.forEach((o) => {
        try {
            const current = dayjs(o.nq);
            const weekNumber = Math.floor(current.diff(firstDay) / 604800000) + 1;
            const dayOfWeek = current.day() === 0 ? 7 : current.day();
            switch (o.fl) {
            case "上课": {
                const lessonList = scheduleList.filter((val) => val.name === o.nr);
                let lesson: Schedule;
                if (lessonList.length) {
                    lesson = lessonList[0];
                } else {
                    scheduleList.push({
                        name: o.nr,
                        location: o.dd || "",
                        type: ScheduleType.PRIMARY,
                        activeTime: {base: []},
                        delOrHideTime: {base: []}
                    });
                    lesson = scheduleList[scheduleList.length - 1];
                }
                scheduleTimeAdd(lesson.activeTime, {
                    dayOfWeek,
                    begin: beginMap[o.kssj],
                    end: endMap[o.jssj],
                    activeWeeks: [weekNumber],
                });
                break;
            }
            case "考试": {
                scheduleList.push({
                    name: "[考试]" + o.nr,
                    location: o.dd || "",
                    type: ScheduleType.EXAM,
                    activeTime: {base: []},
                    delOrHideTime: {base: []}
                });
                scheduleTimeAdd(scheduleList[scheduleList.length - 1].activeTime, {
                    dayOfWeek,
                    begin: examBeginMap[o.kssj.replace("：", ":")],
                    end: examEndMap[o.jssj.replace("：", ":")],
                    activeWeeks: [weekNumber],
                });
                break;
            }
            }
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
    verbose = false,
): Schedule[] | [string, string, boolean][] => {
    const result: Schedule[] = [];
    const verboseResult: [string, string, boolean][] = [];
    const segments = script.split("strHTML =").slice(1);
    const beginList = [1, 3, 6, 8, 10, 12];
    const endList = [2, 5, 7, 9, 11, 14];
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
                    type: ScheduleType.SECONDARY,
                    activeTime: {base: []},
                    delOrHideTime: {base: []}
                });
                lesson = result[result.length - 1];
            }
            scheduleTimeAdd(lesson.activeTime, {
                dayOfWeek,
                begin,
                end,
                activeWeeks: [week],
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
