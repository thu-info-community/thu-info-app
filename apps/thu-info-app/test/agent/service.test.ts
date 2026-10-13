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
