import {agentCatalog, agentBindings, validateSchema} from "@thu-info/lib/src/agent";
import {ToolRegistry, ResultStore} from "../../src/agent/registry";
import {compactContext, hasOpenExchange} from "../../src/agent/context";
import {campusModel} from "../../src/agent/types";
import {fixture} from "./fixtures";
import {byteLength, sanitize} from "../../src/agent/util";

test("catalog covers reviewed functions, excludes credentials and uses hierarchical imports", () => {
	expect(agentCatalog.length).toBeGreaterThan(100);
	expect(agentCatalog.find((tool) => tool.name === "getMadModelToken")).toBeUndefined();
	expect(agentCatalog.find((tool) => tool.name === "getEleRechargePayCode")).toMatchObject({
		effect: "write",
		impact: "confirm",
		mode: "interactive",
	});
	for (const tool of agentCatalog) {
		if (tool.mode === "direct") {
			expect(agentBindings).toHaveProperty(tool.name);
		}
		expect(
			Object.keys(tool.inputSchema.properties ?? {}).some((key) =>
				/password|captcha|cookie|token/i.test(key),
			),
		).toBe(false);
	}
	const registry = new ToolRegistry();
	expect(() => registry.validate("getCalendar", {})).toThrow();
	expect(registry.import("")).toEqual(
		expect.arrayContaining([expect.objectContaining({path: "schedule"})]),
	);
	registry.import("schedule.getCalendar");
	expect(registry.validate("getCalendar", {}).effect).toBe("read");
});

test("generated schemas reject unknown keys, invalid enums and prototype keys", () => {
	const tool = agentCatalog.find((item) => item.name === "switchLang")!;
	expect(validateSchema(tool.inputSchema, {})).toBeDefined();
	expect(validateSchema(tool.inputSchema, {unexpected: true})).toBeDefined();
	expect(
		validateSchema({type: "object", additionalProperties: true}, JSON.parse('{"__proto__":{}}')),
	).toBeDefined();
	expect(validateSchema({type: "number"}, Infinity)).toBeDefined();
});

test("results are paginated, bounded, redacted and transient", () => {
	const results = new ResultStore();
	const page = results.put(
		Array.from({length: 100}, (_, i) => ({i, text: "x".repeat(2000), token: "secret-value"})),
	) as any;
	expect(byteLength(JSON.stringify(page))).toBeLessThan(32768);
	expect(JSON.stringify(page)).not.toContain("secret-value");
	expect(page.nextOffset).toBeGreaterThan(0);
	results.clear();
	expect(results.read(page.handle, 0)).toMatchObject({expired: true});
	expect(sanitize({basics: {csrf: "secret"}, cookie: "s", text: "Bearer abc.def"})).toEqual({
		basics: {},
		text: "[credential omitted]",
	});
});

test("compaction removes old protocol atomically, retaining task and action records with offline fallback", async () => {
	const {session} = fixture();
	const checkpoint = session.checkpoint;
	checkpoint.request = "Current task";
	checkpoint.messages = [
		{role: "user", content: "x".repeat(20000)},
		{
			role: "assistant",
			content: [
				{type: "reasoning", text: "OLD-REASONING"},
				{type: "text", text: "Found result"},
			],
		},
	];
	const changed = await compactContext(checkpoint, campusModel, [], "instructions", async () => {
		throw new Error("offline");
	});
	expect(changed).toBe(true);
	expect(JSON.stringify(checkpoint.messages)).not.toContain("OLD-REASONING");
	expect(JSON.stringify(checkpoint.messages)).toContain("Current task");
	expect(checkpoint.activeTools).toEqual([]);
	expect(hasOpenExchange(checkpoint.messages)).toBe(false);
	checkpoint.messages.push({
		role: "assistant",
		content: [{type: "tool-call", toolName: "x", toolCallId: "x", input: {}}],
	});
	await expect(
		compactContext(checkpoint, campusModel, "x".repeat(20000), "", async () => "summary"),
	).rejects.toThrow("pending");
});

test("compaction retains the newest tool exchange and its reasoning intact", async () => {
	const {session} = fixture();
	session.checkpoint.request = "Summarize the latest result";
	session.checkpoint.messages = [
		{role: "user", content: "long history ".repeat(3000)},
		{
			role: "assistant",
			content: [
				{type: "reasoning", text: "RETAINED-REASONING"},
				{type: "tool-call", toolName: "getCalendar", toolCallId: "tail", input: {}},
			],
		},
		{
			role: "tool",
			content: [
				{
					type: "tool-result",
					toolCallId: "tail",
					toolName: "getCalendar",
					output: {type: "json", value: {importantFact: "NEW-FACT"}},
				},
			],
		},
	];
	await compactContext(
		session.checkpoint,
		campusModel,
		[],
		"instructions",
		async () => "Past summary",
	);
	expect(JSON.stringify(session.checkpoint.messages)).toContain("RETAINED-REASONING");
	expect(JSON.stringify(session.checkpoint.messages)).toContain("NEW-FACT");
	expect(hasOpenExchange(session.checkpoint.messages)).toBe(false);
});
