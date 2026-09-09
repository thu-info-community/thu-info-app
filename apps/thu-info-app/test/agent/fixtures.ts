import {newSession, SessionStore} from "../../src/agent/storage";
import type {SessionStorage, ToolContext} from "../../src/agent/types";
import {canonical} from "../../src/agent/util";
import type {CompletionTransport} from "../../src/agent/model";

export const memoryStorage = () => {
	const entries = new Map<string, string>();
	const storage: SessionStorage = {
		read: async (key) => entries.get(key) ?? null,
		write: async (key, value) => {
			entries.set(key, value);
		},
		remove: async (key) => {
			entries.delete(key);
		},
		keys: async () => [...entries.keys()],
	};
	return {entries, storage};
};
export const fixture = () => {
	const {entries, storage} = memoryStorage();
	const sessions = new SessionStore(storage, "student");
	const session = newSession("student", "test");
	const context: ToolContext = {
		account: "student",
		assertAccess: jest.fn(),
		prepare: jest.fn(async (tool, args) => `${tool.name}: ${canonical(args)}`),
		invoke: jest.fn(async () => ({success: true})),
		onMutation: jest.fn(async () => {}),
	};
	return {entries, storage, sessions, session, context};
};
export const chunk = (delta: unknown, finish: string | null = null) =>
	JSON.stringify({choices: [{index: 0, delta, finish_reason: finish}]});
export const call = (name: string, args: unknown, id = "call1", index = 0) => ({
	index,
	id,
	type: "function",
	function: {name, arguments: JSON.stringify(args)},
});
export const scripted = (
	replies: {text?: string; reasoning?: string; calls?: ReturnType<typeof call>[]}[],
) => {
	const bodies: Record<string, unknown>[] = [];
	const transport: CompletionTransport = async (body, signal, emit) => {
		if (signal?.aborted) {
			throw new Error("aborted");
		}
		bodies.push(body);
		const response = replies.shift();
		if (!response) {
			throw new Error("Unexpected completion request");
		}
		emit(chunk({reasoning_content: response.reasoning ?? "consider"}));
		emit(
			chunk(
				{content: response.text ?? "", tool_calls: response.calls},
				response.calls?.length ? "tool_calls" : "stop",
			),
		);
		emit("[DONE]");
	};
	return {transport, bodies};
};
