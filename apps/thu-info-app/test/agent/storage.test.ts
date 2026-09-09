import {expireSessionDetails, SessionStore} from "../../src/agent/storage";
import {DETAIL_TTL} from "../../src/agent/types";
import {fixture} from "./fixtures";

test("tagged thinking, including interrupted drafts, expires separately from visible text", async () => {
	const {storage, session, entries} = fixture();
	let time = Date.now();
	const sessions = new SessionStore(storage, "student", () => time);
	session.messages = [
		{
			role: "assistant",
			content: "<think>TAGGED-TRACE</think> Durable answer",
			timestamp: time,
		},
		{role: "assistant", content: "<think>INTERRUPTED-TRACE", timestamp: time},
	];
	await sessions.save(session);
	const restored = (await sessions.load(session.header.id))!;
	expect(restored.messages.map((message) => message.content)).toEqual([
		"Durable answer",
		"",
	]);
	expect(restored.messages[1].reasoning).toBe("INTERRUPTED-TRACE");
	time += DETAIL_TTL + 1;
	expireSessionDetails(session, time);
	expect(session.messages[0].content).toBe("Durable answer");
	expect(JSON.stringify(session.messages)).not.toContain("TRACE");
	await sessions.cleanup();
	expect([...entries.values()].join()).not.toContain("TRACE");
});

test("migration is idempotent, preserves text/title/timestamp and omits hidden legacy reasoning", async () => {
	const {sessions} = fixture();
	const history = [
		{
			id: "legacy",
			title: "Title",
			timestamp: 123,
			messages: [
				{role: "user" as const, content: "Hi", timestamp: 100},
				{
					role: "assistant" as const,
					content: "<think>large trace</think> Answer",
				},
			],
		},
	];
	await sessions.migrate(history);
	await sessions.migrate(history);
	expect(await sessions.list()).toHaveLength(1);
	const session = (await sessions.load("legacy"))!;
	expect(session.header.updatedAt).toBe(123);
	expect(session.messages.map((message) => message.content)).toEqual([
		"Hi",
		"Answer",
	]);
	expect(session.messages[0].timestamp).toBe(100);
	expect(JSON.stringify(session)).not.toContain("large trace");
});

test("expired details are collected without deleting conversation text or receipts", async () => {
	const {storage, session, entries} = fixture();
	let time = Date.now();
	const sessions = new SessionStore(storage, "student", () => time);
	session.checkpoint.status = "completed";
	session.messages = [
		{
			id: "m",
			role: "assistant",
			content: "Durable answer",
			reasoning: "LONG-THINKING",
			timestamp: time,
		},
	];
	session.checkpoint.messages = [
		{
			role: "assistant",
			content: [
				{type: "reasoning", text: "LONG-THINKING"},
				{type: "text", text: "Durable answer"},
			],
		},
	];
	await sessions.save(session);
	time += DETAIL_TTL + 1;
	await sessions.cleanup();
	const restored = (await sessions.load(session.header.id))!;
	expect(restored.messages[0].content).toBe("Durable answer");
	expect(restored.messages[0].reasoning).toBeUndefined();
	expect([...entries.values()].join("\n")).not.toContain("LONG-THINKING");
	expect(restored.checkpoint.compactions).toBe(1);
});

test("failed atomic pointer write leaves old conversation intact and orphan chunks collectible", async () => {
	const {sessions, storage, session, entries} = fixture();
	session.messages = [{role: "user", content: "Original"}];
	await sessions.save(session);
	const originalWrite = storage.write;
	storage.write = async (key, value) => {
		if (key.startsWith("pointer/")) {
			throw new Error("disk full");
		}
		await originalWrite(key, value);
	};
	session.messages.push({role: "assistant", content: "UNCOMMITTED"});
	await expect(sessions.save(session)).rejects.toThrow("disk full");
	expect((await sessions.load(session.header.id))!.messages).toHaveLength(1);
	storage.write = originalWrite;
	await sessions.cleanup();
	expect([...entries.values()].join()).not.toContain("UNCOMMITTED");
});

test("accounts are isolated; history listing reads only manifests and title search is paginated", async () => {
	const {sessions, storage, session} = fixture();
	await sessions.save(session);
	const other = new SessionStore(storage, "another");
	expect(await other.list()).toEqual([]);
	expect(await other.load(session.header.id)).toBeNull();
	const read = jest.spyOn(storage, "read");
	await sessions.list(0, 1, "test");
	expect(read.mock.calls.every(([key]) => key.startsWith("pointer/"))).toBe(
		true,
	);
	await other.clear();
	expect(await sessions.list()).toHaveLength(1);
});

test("streaming snapshots do not accumulate quadratically on disk", async () => {
	const {sessions, session} = fixture();
	session.messages = [
		{id: "m", role: "assistant", content: "", timestamp: Date.now()},
	];
	for (let i = 0; i < 45; i++) {
		session.messages[0].content += "x".repeat(1000);
		await sessions.save(session);
	}
	await sessions.cleanup();
	expect(await sessions.usage()).toBeLessThan(60000);
	expect(
		(await sessions.load(session.header.id))!.messages[0].content,
	).toHaveLength(45000);
});
