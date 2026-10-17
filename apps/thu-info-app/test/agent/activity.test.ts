import {AgentRuntime} from "../../src/agent/runtime";
import {expireSessionDetails} from "../../src/agent/storage";
import {findToolInvocation} from "../../src/agent/activity";
import {DETAIL_TTL, MAX_RESULT_BYTES} from "../../src/agent/types";
import {byteLength} from "../../src/agent/util";
import {call, fixture, scripted} from "./fixtures";

test("discovery and reads persist tool-only messages with bounded redacted details", async () => {
	const {session, sessions, context} = fixture();
	(context.invoke as jest.Mock).mockResolvedValue({
		password: "PRIVATE",
		description: "查询结果".repeat(3000),
	});
	const {transport} = scripted([
		{
			calls: [call("import_tools", {path: "schedule.getCalendar"}, "import")],
			reasoning: "",
		},
		{calls: [call("getCalendar", {}, "read")], reasoning: ""},
		{text: "Your calendar", reasoning: ""},
	]);
	await new AgentRuntime(session, sessions, context, transport).send(
		"Calendar",
	);
	expect(session.checkpoint.status).toBe("completed");
	const restored = (await sessions.load(session.header.id))!;
	expect(
		restored.messages
			.flatMap((message) => message.toolInvocations ?? [])
			.map(({id, status}) => ({id, status})),
	).toEqual([
		{id: "import", status: "succeeded"},
		{id: "read", status: "succeeded"},
	]);
	expect(restored.messages.at(-1)?.processingStatus).toBe("completed");
	const result = findToolInvocation(restored, "read")!.output!;
	expect(result).not.toContain("PRIVATE");
	expect(byteLength(result)).toBeLessThanOrEqual(MAX_RESULT_BYTES);
	expect(result).toContain("…");
});

test("a read is visible and durable before its result, and stopping keeps it interrupted", async () => {
	const {session, sessions, context} = fixture();
	session.checkpoint.activeTools = ["getCalendar"];
	let started!: () => void;
	const ready = new Promise<void>((resolve) => {
		started = resolve;
	});
	let release!: () => void;
	const blocked = new Promise<void>((resolve) => {
		release = resolve;
	});
	(context.invoke as jest.Mock).mockImplementation(async () => {
		expect(findToolInvocation(session, "read")?.status).toBe("running");
		expect(
			findToolInvocation((await sessions.load(session.header.id))!, "read"),
		).toBeDefined();
		started();
		await blocked;
		return {calendar: []};
	});
	const {transport} = scripted([
		{calls: [call("getCalendar", {}, "read")], reasoning: ""},
	]);
	const runtime = new AgentRuntime(session, sessions, context, transport);
	const sending = runtime.send("Calendar");
	await ready;
	await runtime.stop();
	release();
	await sending;
	expect(findToolInvocation(session, "read")?.status).toBe("interrupted");
	expect(session.messages.at(-1)?.processingStatus).toBe("paused");
});

test("failed reads and invalid calls are recorded without exposing raw portal errors", async () => {
	const {session, sessions, context} = fixture();
	session.checkpoint.activeTools = ["getCalendar"];
	(context.invoke as jest.Mock).mockRejectedValue(
		new Error("PRIVATE PORTAL HTML"),
	);
	const {transport} = scripted([
		{
			calls: [
				call("getCalendar", {}, "read"),
				call("nonexistent", {}, "invalid", 1),
			],
		},
		{text: "Unable to read"},
	]);
	await new AgentRuntime(session, sessions, context, transport).send(
		"Calendar",
	);
	expect(findToolInvocation(session, "read")?.status).toBe("failed");
	expect(findToolInvocation(session, "invalid")?.status).toBe("failed");
	expect(JSON.stringify(session.messages)).not.toContain("PRIVATE PORTAL HTML");
});

test("a call rejected before execution is recorded as failed", async () => {
	const {session, sessions, context} = fixture();
	const {transport} = scripted([
		{calls: [call("getCalendar", {}, "unimported")]},
		{text: "Unavailable"},
	]);
	await new AgentRuntime(session, sessions, context, transport).send(
		"Calendar",
	);
	expect(context.invoke).not.toHaveBeenCalled();
	expect(findToolInvocation(session, "unimported")?.status).toBe("failed");
});

test.each(["failed", "unknown", "handoff"] as const)(
	"write receipt %s wins over a successful SDK return",
	async (status) => {
		const {session, sessions, context} = fixture();
		session.checkpoint.activeTools = ["create_schedule"];
		(context.invoke as jest.Mock).mockResolvedValue({status});
		const {transport} = scripted([
			{
				calls: [
					call(
						"create_schedule",
						{
							title: "event",
							date: "2026-10-14",
							beginTime: "14:00",
							endTime: "15:00",
						},
						"write",
					),
				],
			},
			{text: "Result"},
		]);
		await new AgentRuntime(session, sessions, context, transport).send(
			"Create event",
		);
		expect(findToolInvocation(session, "write")?.status).toBe(status);
		if (status === "unknown") {
			const runtime = new AgentRuntime(session, sessions, context, transport);
			await runtime.reconcile("write", "succeeded");
			expect(findToolInvocation(session, "write")?.status).toBe("succeeded");
		}
	},
);

test("detail expiry does not remove invocation receipts or recreate their payloads on resume", async () => {
	const {session, sessions, context} = fixture();
	session.checkpoint.activeTools = ["getCalendar"];
	const {transport} = scripted([
		{calls: [call("getCalendar", {}, "read")]},
		{text: "Answer"},
		{text: "Next answer"},
	]);
	const runtime = new AgentRuntime(session, sessions, context, transport);
	await runtime.send("Calendar");
	await sessions.cleanup(true);
	const restored = (await sessions.load(session.header.id))!;
	expect(findToolInvocation(restored, "read")).toMatchObject({
		status: "succeeded",
	});
	expect(findToolInvocation(restored, "read")?.input).toBeUndefined();
	expect(findToolInvocation(restored, "read")?.output).toBeUndefined();
	await new AgentRuntime(restored, sessions, context, transport).send("Next");
	expect(findToolInvocation(restored, "read")?.output).toBeUndefined();
	// The same receipt also survives time-based expiration, independently of model context.
	expireSessionDetails(restored, Date.now() + DETAIL_TTL + 1);
	expect(findToolInvocation(restored, "read")?.status).toBe("succeeded");
});

test("read IDs reused after a protocol reset update the new invocation only", async () => {
	const {session, sessions, context} = fixture();
	session.checkpoint.activeTools = ["getCalendar"];
	const {transport} = scripted([
		{calls: [call("getCalendar", {}, "read")]},
		{text: "First answer"},
		{calls: [call("import_tools", {path: "schedule.getCalendar"}, "reimport")]},
		{calls: [call("getCalendar", {}, "read")]},
		{text: "Unable to read again"},
	]);
	await new AgentRuntime(session, sessions, context, transport).send(
		"First question",
	);
	await sessions.cleanup(true);
	const restored = (await sessions.load(session.header.id))!;
	(context.invoke as jest.Mock).mockRejectedValue(
		new Error("Portal unavailable"),
	);
	await new AgentRuntime(restored, sessions, context, transport).send(
		"Second question",
	);
	expect(context.invoke).toHaveBeenCalledTimes(2);
	expect(
		restored.messages
			.flatMap((message) => message.toolInvocations ?? [])
			.filter(({id}) => id === "read")
			.map(({status}) => status),
	).toEqual(["succeeded", "failed"]);
});
