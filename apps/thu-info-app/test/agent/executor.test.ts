import {ToolExecutor} from "../../src/agent/executor";
import {ToolRegistry} from "../../src/agent/registry";
import {fixture} from "./fixtures";

const setup = () => {
	const data = fixture();
	data.session.checkpoint.status = "running";
	const registry = new ToolRegistry();
	registry.import("app.naiveSendMail");
	registry.import("schedule.create_schedule");
	const executor = new ToolExecutor(data.session, registry, data.context, () =>
		data.sessions.save(data.session),
	);
	return {...data, registry, executor};
};
// Discover actual parameter names from generated schema so drift fails loudly.
const mail = {subject: "hello", content: "body", to: "recipient@example.com"};

test("writes are persisted before dispatch and use single-use approval", async () => {
	const {executor, session, context, sessions, registry} = setup();
	const descriptor = registry.get("naiveSendMail")!;
	const args = Object.fromEntries(
		descriptor.parameters.map((key) => [
			key,
			key.toLowerCase().includes("subject")
				? mail.subject
				: key.toLowerCase().includes("content")
					? mail.content
					: mail.to,
		]),
	);
	await expect(executor.approvalStatus("naiveSendMail", args, "c")).resolves.toBe("user-approval");
	expect(context.invoke).not.toHaveBeenCalled();
	await expect(executor.execute("naiveSendMail", args, "c")).rejects.toThrow("approval");
	await executor.decide("c", true);
	// SDK rechecks the policy when processing a persisted approval response.
	await expect(executor.approvalStatus("naiveSendMail", args, "c")).resolves.toBe("not-applicable");
	(context.invoke as jest.Mock).mockImplementation(async () => {
		expect((await sessions.load(session.header.id))!.checkpoint.operations[0].status).toBe(
			"unknown",
		);
		return {sent: true};
	});
	await executor.execute("naiveSendMail", args, "c");
	await executor.execute("naiveSendMail", args, "c2");
	expect(context.invoke).toHaveBeenCalledTimes(1);
	expect(session.checkpoint.operations[0].status).toBe("succeeded");
});

test("routine writes run directly; bulk writes require confirmation", async () => {
	const {executor, context} = setup();
	const args = {title: "event", date: "2026-09-10", beginTime: "14:00", endTime: "15:00"};
	expect(await executor.approvalStatus("create_schedule", args, "c")).toBe("not-applicable");
	await executor.execute("create_schedule", args, "c");
	expect(context.invoke).toHaveBeenCalledTimes(1);
	expect(await executor.approvalStatus("create_schedule", {...args, title: "another"}, "c2")).toBe(
		"user-approval",
	);
});

test("unknown outcomes block retry even in a new run, and regeneration cannot write", async () => {
	const {executor, context, session} = setup();
	const args = {title: "event", date: "2026-09-10", beginTime: "14:00", endTime: "15:00"};
	(context.invoke as jest.Mock).mockRejectedValue(new Error("timeout"));
	await executor.execute("create_schedule", args, "c");
	expect(session.checkpoint.operations[0].status).toBe("unknown");
	session.checkpoint.runId = "new-run";
	session.checkpoint.status = "running";
	expect(await executor.approvalStatus("create_schedule", args, "c2")).toBe("denied");
	await executor.execute("create_schedule", args, "c2");
	expect(context.invoke).toHaveBeenCalledTimes(1);
	session.checkpoint.answerOnly = true;
	expect(await executor.approvalStatus("create_schedule", {...args, title: "new"}, "c3")).toBe(
		"denied",
	);
});

test("changed preview, expired approval, account lock and unimported tools fail closed", async () => {
	const {executor, registry, context, session} = setup();
	const args = Object.fromEntries(
		registry.get("naiveSendMail")!.parameters.map((key) => [key, "test"]),
	);
	await executor.approvalStatus("naiveSendMail", args, "c");
	(context.prepare as jest.Mock).mockResolvedValue("changed target");
	await expect(executor.decide("c", true)).rejects.toThrow("changed");
	session.checkpoint.approvals[0].expiresAt = 0;
	await expect(executor.decide("c", true)).rejects.toThrow("expired");
	await executor.decide("c", false);
	expect(await executor.approvalStatus("naiveSendMail", args, "c2")).toBe("denied");
	await expect(executor.execute("getCalendar", {}, "read")).rejects.toThrow("import");
	(context.assertAccess as jest.Mock).mockImplementation(() => {
		throw new Error("locked");
	});
	await expect(executor.approvalStatus("naiveSendMail", args, "c3")).rejects.toThrow("locked");
	expect(context.invoke).not.toHaveBeenCalled();
});
