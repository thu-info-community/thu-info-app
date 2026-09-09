import {AgentRuntime} from "../../src/agent/runtime";
import {call, fixture, scripted} from "./fixtures";
import {agentCatalog} from "@thu-info/lib/src/agent";
import {DETAIL_TTL} from "../../src/agent/types";

test.each(["<think>", ""])(
	"tagged thinking (opening token %s) is hidden but retained verbatim in the wire protocol",
	async (opening) => {
		const {session, sessions, context} = fixture();
		const original = `${opening}gateway trace</think> Visible answer`;
		const {transport, bodies} = scripted([
			{text: original, reasoning: ""},
			{text: "Next"},
		]);
		const runtime = new AgentRuntime(session, sessions, context, transport);
		await runtime.send("Question");
		expect(session.messages.at(-1)?.content).toBe("Visible answer");
		expect(session.messages.at(-1)?.reasoning).toBe("gateway trace");
		await runtime.send("Follow-up");
		expect(
			(bodies.at(-1)!.messages as any[]).find(
				(message) => message.role === "assistant",
			)?.content,
		).toBe(original);
	},
);

test("simultaneous sends cannot start a second run during detail maintenance", async () => {
	const {session, sessions, context} = fixture();
	session.checkpoint.protocolCreatedAt = Date.now() - DETAIL_TTL - 1;
	const {transport, bodies} = scripted([{text: "One response"}]);
	const runtime = new AgentRuntime(session, sessions, context, transport);
	await Promise.all([runtime.send("First"), runtime.send("Second")]);
	expect(bodies).toHaveLength(1);
	expect(
		session.messages
			.filter((message) => message.role === "user")
			.map((message) => message.content),
	).toEqual(["First"]);
});

test("SDK discovers, imports and executes reads, then returns an answer with reasoning replay", async () => {
	const {session, sessions, context} = fixture();
	const {transport, bodies} = scripted([
		{calls: [call("import_tools", {path: ""}, "root")]},
		{calls: [call("import_tools", {path: "schedule"}, "cat")]},
		{calls: [call("import_tools", {path: "schedule.getCalendar"}, "leaf")]},
		{calls: [call("getCalendar", {}, "read")]},
		{text: "Here is your calendar."},
		{text: "Next question answered."},
	]);
	const runtime = new AgentRuntime(session, sessions, context, transport);
	await runtime.send("Show my calendar");
	expect(session.checkpoint.error).toBeUndefined();
	expect(session.checkpoint.status).toBe("completed");
	expect(context.invoke).toHaveBeenCalledTimes(1);
	expect(session.messages.at(-1)?.content).toBe("Here is your calendar.");
	expect((bodies[0].tools as any[]).map((tool) => tool.function.name)).toEqual([
		"import_tools",
		"read_result",
		"request_user_input",
	]);
	expect(
		(bodies[3].tools as any[]).map((tool) => tool.function.name),
	).toContain("getCalendar");
	await runtime.send("What about tomorrow?");
	expect(session.checkpoint.error).toBeUndefined();
	expect(
		(bodies.at(-1)!.messages as any[])
			.filter((message) => message.role === "assistant")
			.every((message) => message.reasoning_content === "consider"),
	).toBe(true);
});

test("approval survives restart and invokes exactly once through the real SDK resume path", async () => {
	const {session, sessions, context} = fixture();
	const args = Object.fromEntries(
		agentCatalog
			.find((tool) => tool.name === "naiveSendMail")!
			.parameters.map((key) => [key, "test"]),
	);
	const {transport, bodies} = scripted([
		{calls: [call("import_tools", {path: "app.naiveSendMail"}, "import")]},
		{calls: [call("naiveSendMail", args, "mail")]},
		{text: "Email sent."},
	]);
	const runtime = new AgentRuntime(session, sessions, context, transport);
	await runtime.send("Send my email");
	expect(session.checkpoint.error).toBeUndefined();
	expect(session.checkpoint.status).toBe("awaiting_approval");
	expect(context.invoke).not.toHaveBeenCalled();
	const restored = (await sessions.load(session.header.id))!;
	const resumed = new AgentRuntime(restored, sessions, context, transport);
	await resumed.respond(restored.checkpoint.approvals[0].id, true);
	expect(restored.checkpoint.error).toBeUndefined();
	expect(context.invoke).toHaveBeenCalledTimes(1);
	expect(restored.checkpoint.status).toBe("completed");
	expect(
		(bodies.at(-1)!.messages as any[]).some(
			(message) => message.role === "tool" && message.tool_call_id === "mail",
		),
	).toBe(true);
});

test("multiple approvals resume as one SDK approval batch; rejection cannot execute", async () => {
	const {session, sessions, context} = fixture();
	const args = Object.fromEntries(
		agentCatalog
			.find((tool) => tool.name === "naiveSendMail")!
			.parameters.map((key) => [key, "test"]),
	);
	const second = Object.fromEntries(
		Object.keys(args).map((key) => [key, "different"]),
	);
	const {transport} = scripted([
		{calls: [call("import_tools", {path: "app.naiveSendMail"}, "import")]},
		{
			calls: [
				call("naiveSendMail", args, "mail1"),
				call("naiveSendMail", second, "mail2", 1),
			],
		},
		{text: "One sent, one rejected."},
	]);
	const runtime = new AgentRuntime(session, sessions, context, transport);
	await runtime.send("Send these emails");
	expect(session.checkpoint.approvals).toHaveLength(2);
	await runtime.respond(session.checkpoint.approvals[0].id, true);
	expect(context.invoke).not.toHaveBeenCalled();
	await runtime.respond(session.checkpoint.approvals[1].id, false);
	expect(session.checkpoint.error).toBeUndefined();
	expect(context.invoke).toHaveBeenCalledTimes(1);
	expect(session.checkpoint.status).toBe("completed");
});

test("clarification pauses without another model request, and answer continues the same run", async () => {
	const {session, sessions, context} = fixture();
	const {transport, bodies} = scripted([
		{
			calls: [
				call("request_user_input", {
					question: "Which day?",
					choices: ["Today", "Tomorrow"],
				}),
			],
		},
		{text: "Tomorrow it is."},
	]);
	const runtime = new AgentRuntime(session, sessions, context, transport);
	await runtime.send("Find a classroom");
	expect(session.checkpoint.status).toBe("awaiting_input");
	expect(bodies).toHaveLength(1);
	const run = session.checkpoint.runId;
	await runtime.answer("Tomorrow");
	expect(session.checkpoint.error).toBeUndefined();
	expect(session.checkpoint.status).toBe("completed");
	expect(session.checkpoint.runId).toBe(run);
});

test("truncated tool call cannot execute, even after continue", async () => {
	const {session, sessions, context} = fixture();
	const runtime = new AgentRuntime(
		session,
		sessions,
		context,
		async (_body, _signal, emit) => {
			emit(
				JSON.stringify({
					choices: [
						{
							delta: {tool_calls: [call("create_schedule", {title: "bad"})]},
							finish_reason: "length",
						},
					],
				}),
			);
		},
	);
	await runtime.send("Create an event");
	expect(session.checkpoint.status).toBe("failed");
	expect(context.invoke).not.toHaveBeenCalled();
	await runtime.resume();
	expect(context.invoke).not.toHaveBeenCalled();
});

test("crash after approval preparation but before the SDK step checkpoint can resume", async () => {
	const {session, sessions, context} = fixture();
	const args = Object.fromEntries(
		agentCatalog
			.find((tool) => tool.name === "naiveSendMail")!
			.parameters.map((key) => [key, "test"]),
	);
	const {transport} = scripted([{text: "Sent after approval."}]);
	const beforeCrash = new AgentRuntime(session, sessions, context, transport);
	beforeCrash.registry.import("app.naiveSendMail");
	session.checkpoint.activeTools = beforeCrash.registry.activeNames();
	session.checkpoint.status = "running";
	session.checkpoint.messages = [
		{role: "user", content: "Send email"},
		{
			role: "assistant",
			content: [
				{type: "reasoning", text: "reason"},
				{
					type: "tool-call",
					toolCallId: "prepared",
					toolName: "naiveSendMail",
					input: args,
				},
			],
		},
	];
	await beforeCrash.executor.approvalStatus("naiveSendMail", args, "prepared");
	const restored = (await sessions.load(session.header.id))!;
	const afterCrash = new AgentRuntime(restored, sessions, context, transport);
	await afterCrash.respond(restored.checkpoint.approvals[0].id, true);
	expect(restored.checkpoint.error).toBeUndefined();
	expect(restored.checkpoint.status).toBe("completed");
	expect(context.invoke).toHaveBeenCalledTimes(1);
});

test("reusing a model call ID never dispatches a second tool", async () => {
	const {session, sessions, context} = fixture();
	const {transport} = scripted([
		{calls: [call("import_tools", {path: "schedule.getCalendar"}, "same")]},
		{calls: [call("getCalendar", {}, "same")]},
	]);
	await new AgentRuntime(session, sessions, context, transport).send(
		"Calendar",
	);
	expect(session.checkpoint.status).toBe("failed");
	expect(session.checkpoint.error).toContain("reused");
	expect(context.invoke).not.toHaveBeenCalled();
});

test("switching sessions does not turn a completed conversation into a paused task", async () => {
	const {session, sessions, context} = fixture();
	const {transport} = scripted([{text: "Done"}]);
	const runtime = new AgentRuntime(session, sessions, context, transport);
	await runtime.send("Hello");
	await runtime.stopAndWait();
	expect(session.checkpoint.status).toBe("completed");
});

test("locking previously read private data prevents another model request", async () => {
	const {session, sessions, context} = fixture();
	const {transport, bodies} = scripted([
		{calls: [call("import_tools", {path: "finance.getBankPayment"}, "import")]},
		{calls: [call("getBankPayment", {}, "payment")]},
		{text: "Your financial result"},
	]);
	const runtime = new AgentRuntime(session, sessions, context, transport);
	await runtime.send("Show payments");
	expect(session.checkpoint.protectedTools).toContain("getBankPayment");
	(context.assertAccess as jest.Mock).mockImplementation((tool) => {
		if (tool?.lock) {
			throw new Error("locked");
		}
	});
	await expect(runtime.send("Repeat the result")).rejects.toThrow("locked");
	expect(bodies).toHaveLength(3);
});

test("a long-lived runner expires old reasoning before its next request", async () => {
	const {session, sessions, context} = fixture();
	const {transport, bodies} = scripted([{text: "New answer"}]);
	session.checkpoint.protocolCreatedAt = Date.now() - DETAIL_TTL - 1;
	session.checkpoint.messages = [
		{
			role: "assistant",
			content: [
				{type: "reasoning", text: "EXPIRED_REASONING"},
				{type: "text", text: "Old answer"},
			],
		},
	];
	const runtime = new AgentRuntime(session, sessions, context, transport);
	await runtime.send("Continue the conversation");
	expect(session.checkpoint.error).toBeUndefined();
	expect(JSON.stringify(bodies)).not.toContain("EXPIRED_REASONING");
	expect(session.checkpoint.compactions).toBeGreaterThan(0);
});
