import type {CompletionTransport} from "../../src/agent/model";
import type {Conversation} from "../../src/agent/types";

jest.mock("react-native", () => ({
	AppState: {addEventListener: jest.fn()},
}));
jest.mock("../../src/redux/store", () => {
	const state = {
		auth: {userId: "student"},
		config: {
			appLocked: false,
			agentEnabled: undefined as boolean | undefined,
			deepseekToken: "stale-legacy-token",
		},
		deepseek: {history: [] as Conversation[]},
	};
	const listeners: (() => void)[] = [];
	const store = {
		subscribe: jest.fn((listener: () => void) => listeners.push(listener)),
		notify: () => listeners.forEach((listener) => listener()),
		dispatch: jest.fn((action: {type: string}) => {
			if (action.type === "deepseek/deepseekMigrationComplete") {
				state.deepseek.history = [];
			}
			store.notify();
		}),
	};
	return {
		state,
		currState: () => state,
		helper: {
			userId: "student",
			getMadModelToken: jest.fn(async () => "fresh-account-token"),
		},
		store,
	};
});
jest.mock("../../src/agent/nativeStorage", () => ({
	nativeSessionStorage: require("./fixtures").memoryStorage().storage,
}));
jest.mock("../../src/agent/nativeTools", () => ({
	createNativeToolContext: (account: string) => ({
		...require("./fixtures").fixture().context,
		account,
	}),
	sessionNeedsUnlock: jest.fn(() => false),
}));
jest.mock("../../src/agent/nativeTransport", () => ({
	nativeCompletionTransport:
		(getToken: () => Promise<string>): CompletionTransport =>
		async (_body, signal, emit) => {
			await getToken();
			require("../../src/redux/store").store.notify();
			if (signal?.aborted) throw new Error("aborted");
			emit(
				JSON.stringify({
					choices: [
						{
							index: 0,
							delta: {content: "Answer"},
							finish_reason: "stop",
						},
					],
				}),
			);
			emit("[DONE]");
		},
}));

const setup = () => {
	const {agentService} =
		require("../../src/agent/service") as typeof import("../../src/agent/service");
	const {state, helper, store} = jest.requireMock("../../src/redux/store");
	return {agentService, state, helper, store};
};
beforeEach(() => jest.resetModules());

test("opening and repeatedly creating drafts never writes empty histories", async () => {
	const {agentService} = setup();
	const {nativeSessionStorage} = jest.requireMock(
		"../../src/agent/nativeStorage",
	);
	const write = jest.spyOn(nativeSessionStorage, "write");
	const first = await agentService.open();
	expect(await agentService.open()).toBe(first);
	const ids = new Set([first.session.header.id]);
	for (let i = 0; i < 3; i++) {
		const draft = await agentService.open(undefined, true);
		ids.add(draft.session.header.id);
		expect(draft.session.messages).toEqual([]);
	}
	expect(ids.size).toBe(4);
	expect(write).not.toHaveBeenCalled();
	expect(await nativeSessionStorage.keys()).toEqual([]);
	expect(await agentService.forAccount().list()).toEqual([]);
	expect(await agentService.forAccount().usage()).toBe(0);
});

test("the first send persists before authorization and later turns use the same history", async () => {
	const {agentService, helper} = setup();
	const runner = await agentService.open(undefined, true);
	const sessions = agentService.forAccount();
	helper.getMadModelToken.mockImplementationOnce(async () => {
		expect(
			(await sessions.load(runner.session.header.id))?.messages.filter(
				({role}) => role === "user",
			),
		).toEqual([
			expect.objectContaining({role: "user", content: "First question"}),
		]);
		return "fresh-account-token";
	});
	await runner.send("  First question  ");
	await runner.send("Follow-up");
	expect(helper.getMadModelToken).toHaveBeenCalledTimes(1);
	expect(runner.session.checkpoint.status).toBe("completed");
	expect(await sessions.list()).toEqual([
		expect.objectContaining({
			id: runner.session.header.id,
			title: "First question",
			messageCount: 4,
		}),
	]);
	const draft = await agentService.open(undefined, true);
	expect(await agentService.open(runner.session.header.id)).not.toBe(draft);
	expect(await sessions.list()).toHaveLength(1);
	expect(await sessions.load(draft.session.header.id)).toBeNull();
});

test("existing empty histories remain listed and legacy empty histories still migrate", async () => {
	const {agentService, state} = setup();
	const {newSession} =
		require("../../src/agent/storage") as typeof import("../../src/agent/storage");
	const sessions = agentService.forAccount();
	const existing = newSession("student", "Existing empty history");
	await sessions.save(existing);
	state.deepseek.history = [
		{id: "legacy-empty", title: "Legacy empty history", messages: []},
	];
	const opened = await agentService.open(existing.header.id);
	expect(opened.session.messages).toEqual([]);
	expect(state.deepseek.history).toEqual([]);
	expect((await sessions.list()).map(({id}) => id).sort()).toEqual(
		[existing.header.id, "legacy-empty"].sort(),
	);
	await agentService.open(undefined, true);
	expect((await agentService.open("legacy-empty")).session.messages).toEqual(
		[],
	);
	expect(await sessions.list()).toHaveLength(2);
});

test("switching accounts discards an empty draft without saving it to either account", async () => {
	const {agentService, state, helper, store} = setup();
	const draft = await agentService.open();
	state.auth.userId = "another";
	helper.userId = "another";
	store.notify();
	const next = await agentService.open();
	expect(next.session.header.account).toBe("another");
	expect(next.session.header.id).not.toBe(draft.session.header.id);
	expect(await agentService.forAccount("student").list()).toEqual([]);
	expect(await agentService.forAccount("another").list()).toEqual([]);
});

test("signed-out users cannot create a persisted or in-memory conversation", async () => {
	const {agentService, state} = setup();
	state.auth.userId = "";
	await expect(agentService.open(undefined, true)).rejects.toThrow(
		"Sign in to use agent conversations",
	);
	const {nativeSessionStorage} = jest.requireMock(
		"../../src/agent/nativeStorage",
	);
	expect(await nativeSessionStorage.keys()).toEqual([]);
});

test.each([undefined, false, true])(
	"migrates history and runs without the retired preview flag (%s)",
	async (legacyEnabled) => {
		const {agentService, state, helper, store} = setup();
		state.config.agentEnabled = legacyEnabled;
		state.deepseek.history = [
			{
				id: "legacy",
				title: "Saved conversation",
				timestamp: 123,
				messages: [
					{role: "user", content: "Original question", timestamp: 100},
				],
			},
		];
		const runner = await agentService.open();
		expect(runner.session.header).toMatchObject({
			id: "legacy",
			title: "Saved conversation",
			createdAt: 123,
		});
		expect(runner.session.messages[0]).toMatchObject({
			content: "Original question",
			timestamp: 100,
		});
		expect(state.deepseek.history).toEqual([]);
		await runner.send("New question");
		expect(runner.session.checkpoint.status).toBe("completed");
		expect(runner.session.messages.at(-1)?.content).toBe("Answer");
		expect(helper.getMadModelToken).toHaveBeenCalledTimes(1);
		expect(store.dispatch).not.toHaveBeenCalledWith(
			expect.objectContaining({type: "config/configSet"}),
		);
	},
);

test("account changes and privacy locks still stop an active runner", async () => {
	const {agentService, state, store} = setup();
	const runner = await agentService.open();
	jest.spyOn(runner, "isRunning").mockReturnValue(true);
	const stop = jest.spyOn(runner, "stop").mockResolvedValue();
	const clear = jest.spyOn(runner.executor.results, "clear");
	state.config.appLocked = true;
	store.notify();
	expect(stop).toHaveBeenCalledTimes(1);
	state.config.appLocked = false;
	const {sessionNeedsUnlock} = jest.requireMock("../../src/agent/nativeTools");
	sessionNeedsUnlock.mockReturnValueOnce(true);
	store.notify();
	expect(stop).toHaveBeenCalledTimes(2);
	state.auth.userId = "another";
	store.notify();
	expect(stop).toHaveBeenCalledTimes(3);
	expect(clear).toHaveBeenCalledTimes(3);
});

test("a failed migration preserves the original history for retry", async () => {
	const {agentService, state, store} = setup();
	const history = [
		{
			id: "legacy",
			title: "Saved",
			messages: [{role: "user", content: "Keep this"}],
		},
	];
	state.deepseek.history = history;
	const {nativeSessionStorage} = jest.requireMock(
		"../../src/agent/nativeStorage",
	);
	jest
		.spyOn(nativeSessionStorage, "write")
		.mockRejectedValueOnce(new Error("storage unavailable"));
	await expect(agentService.open()).rejects.toThrow("storage unavailable");
	expect(state.deepseek.history).toEqual(history);
	expect(store.dispatch).not.toHaveBeenCalled();
});
