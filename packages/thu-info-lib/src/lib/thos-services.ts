import type { InfoHelper } from "../index";
import { roamingWrapper } from "./core";
import { uFetch } from "../utils/network";
import { LibError } from "../utils/error";
import type {
    ThosCounts,
    ThosPage,
    ThosPhaseStep,
    ThosRelatedService,
    ThosService,
    ThosTask,
    ThosTaskKind,
} from "../models/home/thos-services";

// Same THOS portal roaming entry used by getScoreByCourseId; no separate login implementation.
export const THOS_ROAM_ID = "56B13DDF68BB3DEA13D98E1E3E776D3E";
export const THOS_ORIGIN = "https://thos.tsinghua.edu.cn";
export const THOS_VPN_PREFIX =
  "/https/77726476706e69737468656265737421e4ff4e8f69247b59700f81b9991b2631ca359dd4";
export const THOS_BASE = "https://webvpn.tsinghua.edu.cn" + THOS_VPN_PREFIX;
export const THOS_HOME = THOS_BASE + "/fp/view?m=fp#act=fp/formHome";
export const thosPages = {
    active: "/fp/view?m=fp#act=fp/myserviceapply/indexNew",
    todo: "/fp/view?m=fp#act=fp/taskcenter/tasktodoNew",
    completed: "/fp/view?m=fp#act=fp/myserviceapply/indexFinish",
    services: "/fp/view?m=fp#act=fp/svscenter",
    drafts: "/fp/view?m=fp#act=fp/draft",
    unread: "/fp/view?m=fp#act=fp/carboncopy/carboncopyNew",
    phases: "/fp/view?m=fp#act=fp/aggregation/aggregationList",
};
const paths = {
    counts: "/fp/fp/formHome/allNum",
    active: "/fp/fp/myserviceapply/getZBSXList",
    todo: "/fp/fp/taskcenter/getDBSXList",
    completed: "/fp/fp/myserviceapply/getBJSXList",
    drafts: "/fp/fp/draft/pageDraft",
    unread: "/fp/fp/carboncopy/getDYSXList",
    phases: "/fp/fp/aggregation/getAggItemList",
    phaseSteps: "/fp/aggregation/getActWork",
    services: "/fp/fp/formHome/AllSvsByConditionpage",
};
type Row = Record<string, unknown>;
const invalid = (message: string): never => {
    throw new LibError(message);
};
const row = (value: unknown): Row =>
    value !== null && typeof value === "object" && !Array.isArray(value)
        ? (value as Row)
        : invalid("在线服务返回了异常的数据结构");
const text = (value: Row, ...keys: string[]) => {
    for (const key of keys) {
        const item = value[key];
        if (
            (typeof item === "string" || typeof item === "number") &&
      String(item).trim()
        )
            return String(item).trim();
    }
    return "";
};
const number = (value: Row, key: string): number | undefined => {
    const raw = text(value, key);
    return /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw))
        ? Number(raw)
        : undefined;
};
const json = (body: string): unknown => {
    if (body.trimStart().startsWith("<"))
        return invalid(
            "在线服务接口返回了网页，需要重新建立 THOS 会话或检查系统状态",
        );
    try {
        return JSON.parse(body);
    } catch {
        return invalid("在线服务返回了无法识别的数据");
    }
};
export const parseThosBody = (body: string): Row => {
    return row(json(body));
};
export const parseThosCounts = (value: unknown): ThosCounts => {
    const data = row(value);
    const active = number(data, "zbNum"),
        todo = number(data, "AuditSvsNum");
    if (active === undefined || todo === undefined)
        return invalid("在线服务首页字段发生变化，未将错误响应当成零条事务");
    return {
        active,
        todo,
        completed: number(data, "bjNum"),
        drafts: number(data, "DraftNum"),
        returned: number(data, "th"),
        unread: number(data, "CarboncopyNum"),
    };
};

export const isThosUniversityUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        return (
            url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (!url.port || url.port === "443") &&
      (url.hostname === "tsinghua.edu.cn" ||
        url.hostname.endsWith(".tsinghua.edu.cn"))
        );
    } catch {
        return false;
    }
};
export const isThosAuthUrl = (value: string): boolean => {
    if (!isThosUniversityUrl(value)) return false;
    const url = new URL(value);
    return (
        url.hostname === "id.tsinghua.edu.cn" ||
    url.hostname === "oauth.tsinghua.edu.cn" ||
    /\/(login|auth|cas)(\/|$)/i.test(url.pathname)
    );
};
export const routeThosUrl = (value: string): string => {
    if (!isThosUniversityUrl(value))
        return invalid("只支持清华大学 HTTPS 服务地址");
    const url = new URL(value);
    if (url.hostname === "thos.tsinghua.edu.cn")
        return THOS_BASE + url.pathname + url.search + url.hash;
    return url.href;
};
export const isThosPage = (value: string): boolean => {
    if (!isThosUniversityUrl(value)) return false;
    const url = new URL(value);
    return (
        !isThosAuthUrl(value) &&
    ((url.hostname === "thos.tsinghua.edu.cn" &&
      url.pathname.startsWith("/fp/")) ||
      (url.hostname === "webvpn.tsinghua.edu.cn" &&
        url.pathname.startsWith(THOS_VPN_PREFIX + "/fp/")))
    );
};

const normalizeThosTarget = (value: string, fallback: string): string => {
    if (value.startsWith("/")) return THOS_BASE + value;
    try {
        return routeThosUrl(value);
    } catch {
        return THOS_BASE + fallback;
    }
};
const workflowStatus = (value: Row): string | undefined => {
    const state = text(value, "CURRENT_STATE", "current_state");
    return {
        "0": "撤回申请",
        "1": "正在办理",
        "4": "办理成功",
        "5": "办理失败",
    }[state];
};
const parseProgress = (current: number | undefined, total: number | undefined) =>
    current !== undefined && total !== undefined && total > 0 && current <= total
        ? Math.floor((current / total) * 100)
        : undefined;
const parseRelatedServices = (
    value: unknown,
    aggregateId: string,
): ThosRelatedService[] | undefined => {
    if (value === undefined || value === null) return undefined;
    if (!Array.isArray(value))
        return invalid("在线服务阶段性事项关联服务返回异常");
    return value.map((raw) => {
        const data = row(raw);
        const id = text(data, "SERVICE_ID", "service_id");
        const name = text(data, "SERVICE_NAME", "service_name");
        if (!id || !name)
            return invalid("在线服务阶段性关联服务字段发生变化，请打开系统原页核对");
        return {
            id,
            name,
            url:
                THOS_BASE +
                `/fp/view?m=fp#seqPid=${encodeURIComponent(aggregateId)}&from=hall&serveID=${encodeURIComponent(id)}&act=fp/serveapply`,
        };
    });
};

export const parseThosDraft = (value: unknown): ThosTask => {
    const data = row(value);
    const id = text(data, "processInstId", "process_inst_id", "procinst_id");
    const serviceId = text(data, "serviceId", "service_id");
    const title = text(data, "draftName", "service_name", "SERVICE_NAME");
    if (!id || !title)
        return invalid("在线服务草稿字段发生变化，请打开系统原页核对");
    const target = serviceId
        ? `/fp/view?m=fp#act=fp/serveapply&serveID=${encodeURIComponent(serviceId)}&procinstId=${encodeURIComponent(id)}`
        : thosPages.drafts;
    return {
        id,
        key: id,
        serviceId: serviceId || undefined,
        title,
        kind: "drafts",
        status: "草稿",
        node: "",
        date: text(data, "modifyTime", "startTime"),
        summary: text(data, "draftSummary"),
        url: THOS_BASE + target,
    };
};

export const parseThosUnread = (value: unknown): ThosTask => {
    const data = row(value);
    const id = text(data, "procinst_id", "proc_inst_id", "PROC_INST_ID");
    const taskId = text(data, "task_id", "WORKITEM_INS_ID", "TASK_ID");
    const serviceId = text(data, "service_id", "SERVICE_ID");
    const title = text(data, "service_name", "SERVICE_NAME");
    if (!id || !title)
        return invalid("在线服务待阅事项字段发生变化，请打开系统原页核对");
    const readState = text(data, "READSTATE", "readState");
    const readStatus = readState
        ? text(data, "READ_TYPE") === "1" && text(data, "APPROVE_PERSON")
            ? `任务已被${text(data, "APPROVE_PERSON")}办理`
            : "已阅"
        : "未阅";
    const rawUrl = text(data, "URL", "url");
    const target = rawUrl
        ? normalizeThosTarget(rawUrl, thosPages.unread)
        : serviceId && taskId
            ? THOS_BASE +
                `/fp/view?m=fp#service_id=${encodeURIComponent(serviceId)}&task_id=${encodeURIComponent(taskId)}&procinst_id=${encodeURIComponent(id)}&pt=done&pr=read&act=fp/taskcenter/todo`
            : THOS_BASE + thosPages.unread;
    return {
        id,
        key: taskId ? `${id}:${taskId}` : id,
        serviceId: serviceId || undefined,
        title,
        kind: "unread",
        status: readStatus,
        workflowStatus: workflowStatus(data),
        node: text(data, "curActName", "CURRENT_ACT_NAME", "task_name"),
        date: text(data, "apply_time", "start_time", "START_TIME"),
        summary: text(data, "summary"),
        url: target,
    };
};

export const parseThosPhase = (value: unknown): ThosTask => {
    const data = row(value);
    const id = text(data, "AGG_PROC_ID", "agg_proc_id");
    const title = text(data, "NAME", "name");
    if (!id || !title)
        return invalid("在线服务阶段性事项字段发生变化，请打开系统原页核对");
    const state = text(data, "STATE", "state");
    const nums = number(data, "NUMS");
    const total = number(data, "SUMTEMP");
    return {
        id,
        key: id,
        title,
        kind: "phases",
        status:
            state === "1"
                ? "正在办理"
                : state === "4"
                    ? "办理成功"
                    : state === "5"
                        ? "办理失败"
                        : "状态未知",
        node:
            nums !== undefined && total !== undefined
                ? `当前进度 ${nums}/${total}`
                : "",
        date: "",
        progress: parseProgress(nums, total),
        relatedServices: parseRelatedServices(data.REL, id),
        url: THOS_BASE +
            `/fp/view?m=fp#act=fp/aggregation/aggregationList&procinst_id=${encodeURIComponent(id)}`,
    };
};

export const parseThosPhaseSteps = (value: unknown): ThosPhaseStep[] => {
    if (!Array.isArray(value))
        return invalid("在线服务阶段性事项步骤返回异常");
    return value.map((raw, index) => {
        const data = row(raw);
        const order = text(data, "ACT_ORDER_ID", "act_order_id") || String(index + 1);
        const name = text(data, "ACT_NAME", "act_name");
        const rawItems = data.itemInfo;
        if (!name || !Array.isArray(rawItems))
            return invalid("在线服务阶段性事项步骤字段发生变化，请打开系统原页核对");
        return {
            order,
            name,
            state: text(data, "ACT_STATE", "act_state"),
            items: rawItems.map((rawItem, itemIndex) => {
                const item = row(rawItem);
                const itemName = text(item, "ITEM_NAME", "item_name");
                if (!itemName)
                    return invalid("在线服务阶段性服务字段发生变化，请打开系统原页核对");
                const serviceId = text(item, "SERVICE_ID", "service_id");
                const workItemId = text(item, "WORKITEM_ID", "workitem_id");
                const rawUrl = text(item, "ITEM_URL", "item_url");
                return {
                    id: workItemId || serviceId || `${order}:${itemIndex}`,
                    name: itemName,
                    state: text(item, "ITEM_STATE", "item_state"),
                    serviceId: serviceId || undefined,
                    url: rawUrl
                        ? normalizeThosTarget(rawUrl, thosPages.phases)
                        : undefined,
                };
            }),
        };
    });
};

export const parseThosTask = (value: unknown, kind: ThosTaskKind): ThosTask => {
    if (kind === "drafts") return parseThosDraft(value);
    if (kind === "unread") return parseThosUnread(value);
    if (kind === "phases") return parseThosPhase(value);
    const data = row(value);
    const id = text(
        data,
        "proc_inst_id",
        "procinst_id",
        "PROC_INST_ID",
        "PROCINST_ID",
    );
    const title = text(data, "service_name", "SERVICE_NAME"),
        serviceId = text(data, "service_id", "SERVICE_ID");
    if (!id || !title)
        return invalid("在线服务事务字段发生变化，请打开系统原页核对");
    const returned = kind !== "completed" && text(data, "BUTSTATUS") === "1";
    const action =
    kind !== "completed" && (returned || text(data, "APPROVE") === "1");
    const taskId =
    kind === "todo"
        ? text(data, "task_id", "WORKITEM_INS_ID", "TASK_ID")
        : text(data, "CREATER_WORKITEM_INS_ID");
    const encode = encodeURIComponent;
    let target = thosPages[kind];
    if (kind === "todo" && text(data, "sign") === "1" && taskId) {
        target = `/fp/fp/outerTaskCenter/workItem?workItemId=${encode(taskId)}`;
    } else if (text(data, "TYPE") === "other") {
        target = `/fp/fp/outerTaskCenter/process?processId=${encode(id)}`;
    } else if (
        (action || kind === "todo") &&
    taskId &&
    serviceId &&
    text(data, "isReassign") !== "1"
    ) {
        target = `/fp/view?m=fp#service_id=${encode(serviceId)}&task_id=${encode(taskId)}&procinst_id=${encode(id)}&pt=undone${kind === "active" ? "&from=myservicecapplyNew" : ""}&act=fp/taskcenter/todo`;
    } else if (serviceId && kind !== "todo") {
        target = `/fp/view?m=fp#service_id=${encode(serviceId)}&procinst_id=${encode(id)}&act=fp/myserviceapply/view`;
    }
    const rawProgress = text(data, "SCHEDULE").replace(/%$/, "");
    const progress = rawProgress ? Number(rawProgress) : NaN;
    const completed: Record<string, string> = {
        "4": "办理成功",
        "5": "办理失败",
        "9": "已撤回",
    };
    return {
        id,
        key: kind === "todo" && taskId ? `${id}:${taskId}` : id,
        serviceId: serviceId || undefined,
        title,
        kind,
        status: returned
            ? "退回修改"
            : action || kind === "todo"
                ? "待我处理"
                : kind === "active"
                    ? "正在办理"
                    : (completed[text(data, "current_state", "CURRENT_STATE")] ??
            "已办结"),
        node: text(data, "CURRENT_ACT_NAME", "task_name", "ACT_NAME"),
        date: text(data, "complete_time", "apply_time", "start_time", "START_TIME"),
        progress:
      Number.isFinite(progress) && progress >= 0 && progress <= 100
          ? Math.floor(progress)
          : undefined,
        url: THOS_BASE + target,
    };
};
export const parseThosService = (value: unknown): ThosService => {
    const data = row(value),
        id = text(data, "ID", "SERVICE_ID"),
        name = text(data, "NAME", "SERVICE_NAME");
    if (!id || !name)
        return invalid("在线服务目录字段发生变化，请打开系统原页核对");
    const grouped =
    ["3", "6"].includes(text(data, "UW_TYPE", "TYPE")) ||
    text(data, "IS_TIME_VALID") === "0";
    const serviceKinds = new Map<string, ThosService["kind"]>([
        ["0", "form"], ["1", "guide"], ["2", "integration"],
        ["3", "group"], ["6", "group"],
    ]);
    return {
        id,
        name,
        department: text(data, "UNIT_NAME", "UNIT_SHORT_NAME"),
        kind: serviceKinds.get(text(data, "UW_TYPE")),
        inOpenPeriod: text(data, "IS_TIME_VALID") === "1" ? true : text(data, "IS_TIME_VALID") === "0" ? false : undefined,
        url:
      THOS_BASE +
      (grouped
          ? `/fp/view?m=fp#serviceName=${encodeURIComponent(name)}&act=fp/svscenter`
          : `/fp/visitService?service_id=${encodeURIComponent(id)}`),
    };
};

export const collectThosPages = async <T>(
    fetch: (page: number) => Promise<unknown>,
    decode: (value: unknown) => T,
    key: (item: T) => string,
    maxPages = 100,
): Promise<ThosPage<T>> => {
    const found = new Map<string, T>();
    let firstTotal: number | undefined;
    let total = 0,
        stable = true;
    for (let page = 1; page <= maxPages; page++) {
        const data = row(await fetch(page));
        if (!Array.isArray(data.list))
            return invalid("分页响应缺少列表，未将错误响应当作空数据");
        const count = number(data, "total");
        if (
            count === undefined ||
      (data.pageNum !== undefined && number(data, "pageNum") !== page)
        )
            return invalid("在线服务分页返回异常");
        total = count;
        if (firstTotal === undefined) firstTotal = total;
        else if (firstTotal !== total) stable = false;
        const previous = found.size;
        for (const value of data.list) {
            const item = decode(value);
            found.set(key(item), item);
        }
        if (found.size >= total)
            return {
                items: [...found.values()],
                total,
                complete: stable && found.size === total,
            };
        if (found.size === previous) break;
    }
    return { items: [...found.values()], total, complete: false };
};

const read = (
    helper: InfoHelper,
    endpoint: keyof typeof paths,
    params: Row,
): Promise<Row> =>
    roamingWrapper(helper, "default", THOS_ROAM_ID, async () =>
        parseThosBody(
            await uFetch(
                THOS_BASE + paths[endpoint],
        JSON.stringify(params) as never,
        30_000,
        "UTF-8",
        true,
        "application/json;charset=utf-8",
            ),
        ),
    );
const readArray = (
    helper: InfoHelper,
    endpoint: keyof typeof paths,
    params: Row,
): Promise<unknown[]> =>
    roamingWrapper(helper, "default", THOS_ROAM_ID, async () => {
        const value = json(
            await uFetch(
                THOS_BASE + paths[endpoint],
                JSON.stringify(params) as never,
                30_000,
                "UTF-8",
                true,
                "application/json;charset=utf-8",
            ),
        );
        if (!Array.isArray(value))
            return invalid("在线服务阶段性事项步骤返回异常");
        return value;
    });

export const prepareThosSession = async (
    helper: InfoHelper,
): Promise<ThosCounts> => {
    if (helper.mocked())
        return {
            active: 1,
            todo: 1,
            completed: 1,
            drafts: 0,
            returned: 1,
            unread: 0,
        };
    // Validate the business response inside the existing roaming wrapper so stale target sessions get bootstrapped.
    return roamingWrapper(helper, "default", THOS_ROAM_ID, async () =>
        parseThosCounts(
            parseThosBody(
                await uFetch(
                    THOS_BASE + paths.counts,
          "{}" as never,
          30_000,
          "UTF-8",
          true,
          "application/json;charset=utf-8",
                ),
            ),
        ),
    );
};
export const getThosTasks = async (
    helper: InfoHelper,
    kind: ThosTaskKind,
): Promise<ThosPage<ThosTask>> => {
    if (helper.mocked()) {
        const title =
            kind === "todo"
                ? "会议活动及场地申请（演示）"
                : kind === "active"
                    ? "亲友来访人员报备（演示）"
                    : kind === "completed"
                        ? "在读证明申请（演示）"
                        : kind === "drafts"
                            ? "演示草稿"
                            : kind === "unread"
                                ? "演示待阅事项"
                                : "演示阶段性事项";
        return {
            items: [
                {
                    id: `demo-${kind}`,
                    key: `demo-${kind}`,
                    title,
                    kind,
                    status:
                        kind === "completed"
                            ? "办理成功"
                            : kind === "todo"
                                ? "待我处理"
                                : kind === "active"
                                    ? "退回修改"
                                    : kind === "drafts"
                                        ? "草稿"
                                        : kind === "unread"
                                            ? "未阅"
                                            : "正在办理",
                    node: "演示节点",
                    date: "",
                    url: "",
                },
            ],
            total: 1,
            complete: true,
        };
    }
    if (kind === "drafts")
        return collectThosPages(
            (page) =>
                read(helper, "drafts", {
                    draftName: "",
                    processInstId: "",
                    draftSummary: "",
                    pageNum: String(page),
                    pageSize: "10",
                }),
            parseThosDraft,
            (item) => item.key,
        );
    if (kind === "unread")
        return collectThosPages(
            (page) =>
                read(helper, "unread", {
                    service_name: "",
                    start_date: "",
                    end_date: "",
                    apply_name: "",
                    unit_name: "",
                    procinst_id: "",
                    summary: "",
                    readresult: "",
                    bjstart_date: "",
                    bjend_date: "",
                    result: "",
                    pageNum: String(page),
                    pageSize: "10",
                }),
            parseThosUnread,
            (item) => item.key,
        );
    if (kind === "phases") {
        const phasePage = await collectThosPages(
            (pageNumber) =>
                read(helper, "phases", {
                    name: "",
                    agg_proc_id: "",
                    state: "",
                    pageNum: String(pageNumber),
                    pageSize: "10",
                }),
            parseThosPhase,
            (item) => item.key,
        );
        return {
            ...phasePage,
            items: await Promise.all(
                phasePage.items.map(async (item) => ({
                    ...item,
                    phaseSteps: parseThosPhaseSteps(
                        await readArray(helper, "phaseSteps", {
                            agg_proc_id: item.id,
                        }),
                    ),
                })),
            ),
        };
    }
    const fields =
    kind === "todo"
        ? [
            "service_name",
            "job_number",
            "unit_name",
            "procinst_id",
            "currentNode",
            "summary",
            "start_date",
            "end_date",
        ]
        : kind === "completed"
            ? [
                "serviceName",
                "startTime",
                "endTime",
                "assess",
                "result",
                "completestart_time",
                "completeend_time",
                "procinst_id",
                "summary",
            ]
            : [
                "serviceName",
                "startTime",
                "endTime",
                "procinst_id",
                "summary",
                "currentNode",
            ];
    return collectThosPages(
        (page) =>
            read(helper, kind, {
                ...Object.fromEntries(fields.map((k) => [k, ""])),
                ...(kind === "todo" ? { status: "1" } : {}),
                pageNum: page,
                pageSize: 50,
            }),
        (value) => parseThosTask(value, kind),
        (item) => item.key,
    );
};
export const getThosServices = async (
    helper: InfoHelper,
): Promise<ThosPage<ThosService>> => {
    if (helper.mocked())
        return {
            items: ["亲友入校报备", "会议活动及场地申请", "在读证明申请"].map(
                (name, i) => ({
                    id: `demo-${i}`,
                    name: name + "（演示）",
                    department: "演示部门",
                    url: "",
                }),
            ),
            total: 3,
            complete: true,
        };
    return collectThosPages(
        (page) =>
            read(helper, "services", {
                pageNum: page,
                pageSize: 100,
                project_id: "",
                category_ids: "",
                firstCharacter: "",
                unit_id: "",
                orderBy: "defaultAsc",
                isCollect: "all",
                isRecommend: "no",
            }),
        parseThosService,
        (item) => item.id,
    );
};
