import EventSource from "react-native-sse";
import {nativeCompletionTransport} from "../../src/agent/nativeTransport";

jest.mock("react-native-sse", () =>
	jest.fn().mockImplementation(() => ({
		addEventListener: jest.fn(),
		removeAllEventListeners: jest.fn(),
		close: jest.fn(),
	})),
);

const start = async () => {
	const abort = new AbortController();
	const emit = jest.fn();
	const request = nativeCompletionTransport(async () => "fixture-token")(
		{stream: true},
		abort.signal,
		emit,
	);
	await Promise.resolve();
	const source = (EventSource as unknown as jest.Mock).mock.results.at(
		-1,
	)!.value;
	const event = (type: string, data?: string) =>
		source.addEventListener.mock.calls.find(
			([name]: string[]) => name === type,
		)[1]({data});
	return {abort, emit, request, source, event};
};

afterEach(() => {
	jest.useRealTimers();
	jest.clearAllMocks();
});

test("native transport only posts Chat Completions, does not reconnect, and closes on DONE", async () => {
	const {request, event, source, emit} = await start();
	const [url, options] = (EventSource as unknown as jest.Mock).mock.calls[0];
	expect(url).toMatch(/\/v1\/chat\/completions$/);
	expect(options).toMatchObject({method: "POST", pollingInterval: 0});
	event("message", "[DONE]");
	await request;
	expect(emit).toHaveBeenCalledWith("[DONE]");
	expect(source.close).toHaveBeenCalledTimes(1);
	expect(source.removeAllEventListeners).toHaveBeenCalledTimes(1);
});

test("cancellation closes the native connection and removes listeners", async () => {
	const {request, abort, source} = await start();
	const rejected = expect(request).rejects.toThrow("cancelled");
	abort.abort();
	await rejected;
	expect(source.close).toHaveBeenCalledTimes(1);
	expect(source.removeAllEventListeners).toHaveBeenCalledTimes(1);
});

test("idle timeout closes the connection without leaking raw transport errors", async () => {
	jest.useFakeTimers();
	const {request, source} = await start();
	const rejected = expect(request).rejects.toThrow("timed out");
	jest.advanceTimersByTime(90000);
	await rejected;
	expect(source.close).toHaveBeenCalledTimes(1);
});
