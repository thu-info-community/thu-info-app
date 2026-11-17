import {getCampusModels, resolveCampusModel} from "../../src/agent/modelCatalog";
import {fetchCampusModels} from "../../src/utils/webApi";
import {campusModelName, campusModelsTTL} from "../../src/utils/campusModel";
import {migrateDeepseekState} from "../../src/redux/migrations/deepseek";
import type {CampusModelCache} from "../../src/utils/campusModel";

jest.mock("../../src/utils/webApi", () => ({fetchCampusModels: jest.fn()}));
jest.mock("../../src/redux/store", () => {
	const state = {
		config: {deepseekModelName: undefined as string | undefined},
		deepseek: {history: [], modelCache: undefined as CampusModelCache | undefined},
	};
	return {
		currState: () => state,
		store: {dispatch: jest.fn((action) => {
			if (action.type === "deepseek/deepseekModelsReceived") state.deepseek.modelCache = action.payload;
			if (action.type === "config/configSet") state.config.deepseekModelName = action.payload.value;
		})},
	};
});

const {currState} = jest.requireMock("../../src/redux/store");
const request = fetchCampusModels as jest.MockedFunction<typeof fetchCampusModels>;
const now = 1900000000000;
beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(Date, "now").mockReturnValue(now);
	currState().deepseek.modelCache = undefined;
	currState().config.deepseekModelName = undefined;
});
afterEach(() => jest.restoreAllMocks());

test("cached models are used within 24 hours and refreshed at the boundary", async () => {
	currState().deepseek.modelCache = {models: ["old"], fetchedAt: now - campusModelsTTL + 1};
	expect(await getCampusModels()).toEqual(["old"]);
	expect(request).not.toHaveBeenCalled();
	currState().deepseek.modelCache.fetchedAt -= 1;
	request.mockResolvedValueOnce(["new"]);
	expect(await getCampusModels()).toEqual(["new"]);
	expect(currState().deepseek.modelCache).toEqual({models: ["new"], fetchedAt: now});
});

test("concurrent requests share one fetch and a forced refresh bypasses fresh cache", async () => {
	let release!: (models: string[]) => void;
	request.mockImplementationOnce(() => new Promise((resolve) => { release = resolve; }));
	const first = getCampusModels();
	const second = getCampusModels();
	expect(request).toHaveBeenCalledTimes(1);
	release(["one"]);
	expect(await Promise.all([first, second])).toEqual([["one"], ["one"]]);
	request.mockResolvedValueOnce(["two"]);
	expect(await getCampusModels(true)).toEqual(["two"]);
});

test("a failed refresh retains stale models and timestamp, then retries", async () => {
	const cached = {models: ["old"], fetchedAt: now - campusModelsTTL};
	currState().deepseek.modelCache = cached;
	request.mockRejectedValueOnce(new Error("offline"));
	expect(await getCampusModels()).toEqual(["old"]);
	expect(currState().deepseek.modelCache).toBe(cached);
	request.mockResolvedValueOnce(["new"]);
	expect(await getCampusModels()).toEqual(["new"]);
});

test("fresh installations without a cached list report failures", async () => {
	request.mockRejectedValueOnce(new Error("offline"));
	await expect(getCampusModels()).rejects.toThrow("offline");
	expect(currState().deepseek.modelCache).toBeUndefined();
});

test("a successful empty list replaces stale fallback and prevents model requests", async () => {
	currState().deepseek.modelCache = {models: [campusModelName], fetchedAt: 0};
	request.mockResolvedValueOnce([]);
	expect(await getCampusModels()).toEqual([]);
	await expect(resolveCampusModel()).rejects.toThrow("No campus models");
	expect(request).toHaveBeenCalledTimes(1);
});

test("selection is respected, and a removed model falls back to the first configured model", async () => {
	currState().deepseek.modelCache = {models: ["first", "second"], fetchedAt: now};
	currState().config.deepseekModelName = "second";
	expect((await resolveCampusModel()).model).toBe("second");
	currState().config.deepseekModelName = "removed";
	expect((await resolveCampusModel()).model).toBe("first");
	expect(currState().config.deepseekModelName).toBe("first");
});

test("v3.20.0 migration preserves Redux history and seeds a stale fallback", async () => {
	const history = [{id: "previous-tag", title: "Saved conversation", messages: [{role: "user" as const, content: "Hello", timestamp: 123}]}];
	const migrated = migrateDeepseekState({history});
	expect(migrated.history).toBe(history);
	expect(migrated.modelCache).toEqual({models: [campusModelName], fetchedAt: 0});
	currState().deepseek.modelCache = migrated.modelCache;
	request.mockRejectedValueOnce(new Error("offline"));
	expect(await getCampusModels()).toEqual([campusModelName]);
	expect(request).toHaveBeenCalledTimes(1);
});

test("the app.cs client validates and normalizes the public JSON list", async () => {
	const actual = jest.requireActual("../../src/utils/webApi") as typeof import("../../src/utils/webApi");
	const fetch = jest.spyOn(globalThis, "fetch");
	fetch.mockResolvedValueOnce(new Response(JSON.stringify([" first ", "second", "first", " "])));
	expect(await actual.fetchCampusModels()).toEqual(["first", "second"]);
	expect(fetch).toHaveBeenCalledWith("https://app.cs.tsinghua.edu.cn/Api/DeepSeekModels", expect.objectContaining({signal: expect.any(AbortSignal)}));
	fetch.mockResolvedValueOnce(new Response(JSON.stringify({models: ["wrong-shape"]})));
	await expect(actual.fetchCampusModels()).rejects.toThrow("Invalid campus model list");
	fetch.mockResolvedValueOnce(new Response("unavailable", {status: 503}));
	await expect(actual.fetchCampusModels()).rejects.toThrow("Unable to load campus models");
});
