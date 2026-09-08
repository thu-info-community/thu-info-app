import { beforeEach, expect, jest, test } from "@jest/globals";
import {
  collectThosPages,
  getThosTasks,
  isThosAuthUrl,
  isThosPage,
  isThosUniversityUrl,
  parseThosBody,
  parseThosCounts,
  parseThosService,
  parseThosTask,
  prepareThosSession,
  routeThosUrl,
  THOS_BASE,
  THOS_HOME,
  THOS_ORIGIN,
  THOS_ROAM_ID,
} from "../src/lib/thos-services";
import { roamingWrapper } from "../src/lib/core";
import { uFetch } from "../src/utils/network";
import type { InfoHelper } from "../src";

jest.mock("../src/lib/core", () => ({
  roamingWrapper: jest.fn(
    (
      _helper: unknown,
      _policy: unknown,
      _payload: unknown,
      operation: () => Promise<unknown>,
    ) => operation(),
  ),
}));
jest.mock("../src/utils/network", () => ({ uFetch: jest.fn() }));
const helper = { mocked: () => false } as InfoHelper;
const base = {
  proc_inst_id: "synthetic-process",
  service_name: "测试事务",
  service_id: "service&1",
};
beforeEach(() => {
  jest.clearAllMocks();
});

test("THOS uses the existing shared roaming primitive and validates its business response", async () => {
  jest.mocked(uFetch).mockResolvedValue('{"zbNum":3,"AuditSvsNum":2}');
  expect(await prepareThosSession(helper)).toEqual(
    expect.objectContaining({ active: 3, todo: 2 }),
  );
  expect(roamingWrapper).toHaveBeenCalledWith(
    helper,
    "default",
    THOS_ROAM_ID,
    expect.any(Function),
  );
  expect(jest.mocked(uFetch).mock.calls[0]).toEqual([
    THOS_BASE + "/fp/fp/formHome/allNum",
    "{}",
    30000,
    "UTF-8",
    true,
    "application/json;charset=utf-8",
  ]);
});
test.each([
  "<html><title>登录</title></html>",
  "<html>Gateway error</html>",
  "not json",
  "[]",
  "null",
])("non-business response is not an empty session: %s", (body) => {
  expect(() => parseThosCounts(parseThosBody(body))).toThrow();
});
test("missing mandatory counts is a contract failure; optional values stay unknown", () => {
  expect(() => parseThosCounts({ zbNum: 0 })).toThrow();
  expect(() => parseThosCounts({ zbNum: -1, AuditSvsNum: 0 })).toThrow();
  expect(parseThosCounts({ zbNum: "0", AuditSvsNum: "0" })).toEqual(
    expect.objectContaining({ active: 0, todo: 0, completed: undefined }),
  );
});
test("TODO uses the actual task identifier, time and node", () => {
  const task = parseThosTask(
    {
      procinst_id: "p1",
      service_id: "s1",
      service_name: "事项",
      task_id: "work1",
      task_name: "当前节点",
      apply_time: "2026-09-07",
    },
    "todo",
  );
  expect(task).toEqual(
    expect.objectContaining({
      id: "p1",
      key: "p1:work1",
      node: "当前节点",
      date: "2026-09-07",
      status: "待我处理",
    }),
  );
  expect(task.url).toContain("task_id=work1");
});
test("multiple work items on the same process retain distinct keys", () => {
  const a = parseThosTask({ ...base, task_id: "a" }, "todo"),
    b = parseThosTask({ ...base, task_id: "b" }, "todo");
  expect(a.key).not.toBe(b.key);
});
test("returned creator work item uses action route unless reassigned", () => {
  const data = { ...base, BUTSTATUS: "1", CREATER_WORKITEM_INS_ID: "creator" };
  expect(parseThosTask(data, "active").url).toContain("task_id=creator");
  expect(parseThosTask({ ...data, isReassign: "1" }, "active").url).toContain(
    "myserviceapply/view",
  );
});
test("completed state ignores old returned flags and does not invent 100 percent", () => {
  const task = parseThosTask(
    { ...base, BUTSTATUS: "1", APPROVE: "1", current_state: "9" },
    "completed",
  );
  expect(task.status).toBe("已撤回");
  expect(task.progress).toBeUndefined();
});
test.each(["", "nan", "-1", "101", "Infinity"])(
  "invalid progress remains unknown: %s",
  (SCHEDULE) => {
    expect(
      parseThosTask({ ...base, SCHEDULE }, "active").progress,
    ).toBeUndefined();
  },
);
test("valid progress, special work items and escaped identifiers", () => {
  expect(parseThosTask({ ...base, SCHEDULE: "42%" }, "active").progress).toBe(
    42,
  );
  expect(
    parseThosTask({ ...base, sign: "1", task_id: "a&b" }, "todo").url,
  ).toContain("workItemId=a%26b");
  expect(parseThosTask(base, "active").url).toContain("service_id=service%261");
  expect(parseThosTask(base, "todo").url).toContain("tasktodoNew");
});
test("group and unavailable service use official directory launch logic", () => {
  expect(
    parseThosService({ ID: "s1", NAME: "场地", UW_TYPE: 3 }).url,
  ).toContain("act=fp/svscenter");
  expect(
    parseThosService({ ID: "s1", NAME: "场地", IS_TIME_VALID: 0 }).url,
  ).toContain("act=fp/svscenter");
  expect(parseThosService({ ID: "a&b", NAME: "场地" }).url).toContain(
    "service_id=a%26b",
  );
});
test("pagination fetches every page and preserves completeness", async () => {
  const fetch = jest.fn(async (page: number) => ({
    list: [{ id: String(page) }],
    total: 2,
    pageNum: page,
  }));
  const result = await collectThosPages(
    fetch,
    (x) => x as { id: string },
    (x) => x.id,
  );
  expect(result).toEqual({
    items: [{ id: "1" }, { id: "2" }],
    total: 2,
    complete: true,
  });
  expect(fetch).toHaveBeenCalledTimes(2);
});
test("repeated pages stop and cannot claim completeness", async () => {
  const fetch = jest.fn(async () => ({ list: [{ id: "one" }], total: 3 }));
  expect(
    (
      await collectThosPages(
        fetch,
        (x) => x as { id: string },
        (x) => x.id,
      )
    ).complete,
  ).toBe(false);
  expect(fetch).toHaveBeenCalledTimes(2);
});
test("changing totals and the page cap mark results partial", async () => {
  expect(
    (
      await collectThosPages(
        async (page) => ({
          list: [{ id: String(page) }],
          total: page === 1 ? 4 : 2,
        }),
        (x) => x as { id: string },
        (x) => x.id,
      )
    ).complete,
  ).toBe(false);
  expect(
    (
      await collectThosPages(
        async (page) => ({ list: [{ id: String(page) }], total: 999 }),
        (x) => x as { id: string },
        (x) => x.id,
        2,
      )
    ).complete,
  ).toBe(false);
});
test("missing lists, wrong page index and missing totals are failures", async () => {
  for (const response of [
    { total: 0 },
    { list: [], total: 0, pageNum: 2 },
    { list: [] },
  ]) {
    await expect(
      collectThosPages(
        async () => response,
        (x) => x,
        () => "key",
      ),
    ).rejects.toThrow();
  }
});
test("request parameters use real TODO names and status filter", async () => {
  jest.mocked(uFetch).mockResolvedValue('{"list":[],"total":0,"pageNum":1}');
  await getThosTasks(helper, "todo");
  const params = JSON.parse(
    jest.mocked(uFetch).mock.calls[0]![1] as unknown as string,
  );
  expect(params).toEqual(
    expect.objectContaining({
      pageNum: 1,
      pageSize: 50,
      status: "1",
      service_name: "",
      procinst_id: "",
    }),
  );
});
test.each([
  "javascript:alert(1)",
  "http://thos.tsinghua.edu.cn/fp/view",
  "https://thos.tsinghua.edu.cn.evil.example/",
  "https://user@thos.tsinghua.edu.cn/fp/view",
  "https://thos.tsinghua.edu.cn:8443/fp/view",
])("unsafe destination rejected: %s", (url) => {
  expect(isThosUniversityUrl(url)).toBe(false);
  expect(() => routeThosUrl(url)).toThrow();
});
test("VPN rewrite preserves query/hash and does not rewrite the identity provider", () => {
  expect(routeThosUrl(THOS_ORIGIN + "/fp/view?m=fp#id=a%26b")).toBe(
    THOS_BASE + "/fp/view?m=fp#id=a%26b",
  );
  expect(routeThosUrl("https://id.tsinghua.edu.cn/login")).toBe(
    "https://id.tsinghua.edu.cn/login",
  );
  expect(
    isThosAuthUrl("https://id.tsinghua.edu.cn/do/off/ui/auth/login/check"),
  ).toBe(true);
  expect(isThosPage(THOS_HOME)).toBe(true);
  expect(isThosPage(THOS_BASE + "/fp/login")).toBe(false);
  expect(
    isThosPage("https://webvpn.tsinghua.edu.cn/https/another/fp/view"),
  ).toBe(false);
});
test("mock account makes no network requests and has no actionable real URLs", async () => {
  const mock = { mocked: () => true } as InfoHelper;
  const result = await getThosTasks(mock, "active");
  expect(result.items[0]?.url).toBe("");
  expect(uFetch).not.toHaveBeenCalled();
});

test.each([
  [0, "form"], [1, "guide"], [2, "integration"], [3, "group"], [6, "group"],
  [undefined, undefined], ["unknown", undefined], ["__proto__", undefined],
])("native service type maps audited UW_TYPE %s without guessing", (UW_TYPE, kind) => {
  expect(parseThosService({ID: "synthetic", NAME: "合成服务", UW_TYPE}).kind).toBe(kind);
});
test("service open period is separate from eligibility and missing data stays unknown", () => {
  const service = {ID: "synthetic", NAME: "合成服务"};
  expect(parseThosService({...service, IS_TIME_VALID: 1}).inOpenPeriod).toBe(true);
  expect(parseThosService({...service, IS_TIME_VALID: "0"}).inOpenPeriod).toBe(false);
  expect(parseThosService(service).inOpenPeriod).toBeUndefined();
  expect(parseThosService({...service, IS_TIME_VALID: "unknown"}).inOpenPeriod).toBeUndefined();
});
