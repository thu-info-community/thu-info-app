import {ToolExecutor} from "../../src/agent/executor";
import {ToolRegistry} from "../../src/agent/registry";
import {fixture, mailArgs} from "./fixtures";

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
test("writes are persisted before dispatch and use single-use approval", async () => {
	const {executor, session, context, sessions} = setup();
	const args = mailArgs;
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

test("unknown outcomes block retry after details expire and restart, and regeneration cannot write", async () => {
	const {executor, context, session, sessions, registry} = setup();
	const args = {title: "event", date: "2026-09-10", beginTime: "14:00", endTime: "15:00"};
	(context.invoke as jest.Mock).mockRejectedValue(new Error("timeout"));
	await executor.execute("create_schedule", args, "c");
	expect(session.checkpoint.operations[0].status).toBe("unknown");
	const targetFingerprint = session.checkpoint.operations[0].targetFingerprint;
	await sessions.cleanup(true);
	const restored = (await sessions.load(session.header.id))!;
	expect(restored.checkpoint.operations[0].args).toEqual({});
	expect(restored.checkpoint.operations[0].targetFingerprint).toBe(targetFingerprint);
	restored.checkpoint.runId = "new-run";
	restored.checkpoint.status = "running";
	const recovered = new ToolExecutor(restored, registry, context, () => sessions.save(restored));
	expect(await recovered.approvalStatus("create_schedule", args, "c2")).toBe("denied");
	await recovered.execute("create_schedule", args, "c2");
	expect(context.invoke).toHaveBeenCalledTimes(1);
	restored.checkpoint.answerOnly = true;
	expect(await recovered.approvalStatus("create_schedule", {...args, title: "new"}, "c3")).toBe(
		"denied",
	);
});

test("changed policy or preview, expired approval, account lock and unimported tools fail closed", async () => {
	const {executor, registry, context, session, sessions} = setup();
	const args = mailArgs;
	await executor.approvalStatus("naiveSendMail", args, "c");
	const tool = registry.get("naiveSendMail")!;
	const version = tool.version;
	tool.version = "updated-policy";
	await expect(executor.decide("c", true)).rejects.toThrow("expired");
	tool.version = version;
	(context.prepare as jest.Mock).mockResolvedValue("changed target");
	await expect(executor.decide("c", true)).rejects.toThrow("changed");
	session.checkpoint.approvals[0].expiresAt = 0;
	await expect(executor.decide("c", true)).rejects.toThrow("expired");
	await executor.decide("c", false);
	expect((await sessions.load(session.header.id))!.checkpoint.operations[0]).toMatchObject({
		status: "denied",
		targetFingerprint: expect.any(String),
	});
	expect(await executor.approvalStatus("naiveSendMail", args, "c2")).toBe("denied");
	await expect(executor.execute("getCalendar", {}, "read")).rejects.toThrow("import");
	(context.assertAccess as jest.Mock).mockImplementation(() => {
		throw new Error("locked");
	});
	await expect(executor.approvalStatus("naiveSendMail", args, "c3")).rejects.toThrow("locked");
	expect(context.invoke).not.toHaveBeenCalled();
});
