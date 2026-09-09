import {CompletionDecoder, createCampusModel, toChatMessages} from "../../src/agent/model";
import {campusModel} from "../../src/agent/types";
import {call, chunk, scripted} from "./fixtures";

test("reassembles fragmented reasoning and parallel tool arguments without early execution", () => {
	const emitted: unknown[] = [];
	const decoder = new CompletionDecoder((part) => emitted.push(part));
	decoder.push(chunk({reasoning_content: "think"}));
	decoder.push(
		chunk({
			tool_calls: [
				{...call("getCalendar", {}, "c1"), function: {name: "getCalendar", arguments: "{"}},
			],
		}),
	);
	decoder.push(
		chunk(
			{tool_calls: [{index: 0, function: {arguments: "}"}}, call("getUserInfo", {}, "c2", 1)]},
			"tool_calls",
		),
	);
	expect(emitted.some((part: any) => part.type === "tool-call")).toBe(false);
	const result = decoder.complete();
	expect(result.content.filter((part) => part.type === "tool-call")).toHaveLength(2);
	expect(decoder.reasoning).toBe("think");
});

test.each(["length", "stop"])("rejects tool arguments with invalid finish reason %s", (finish) => {
	const decoder = new CompletionDecoder();
	decoder.push(chunk({tool_calls: [call("create_schedule", {})]}, finish));
	expect(() => decoder.complete()).toThrow();
});

test("rejects premature EOF and malformed JSON; never repairs executable arguments", () => {
	const early = new CompletionDecoder();
	early.push(chunk({content: "partial"}));
	expect(() => early.complete()).toThrow();
	const invalid = new CompletionDecoder();
	invalid.push(
		chunk(
			{
				tool_calls: [
					{...call("create_schedule", {}), function: {name: "create_schedule", arguments: "{bad"}},
				],
			},
			"tool_calls",
		),
	);
	expect(() => invalid.complete()).toThrow();
});

test("replays reasoning across user turns and requires complete exchanges", () => {
	const prompt: any[] = [
		{
			role: "assistant",
			content: [
				{type: "reasoning", text: "prior thinking"},
				{type: "tool-call", toolCallId: "c", toolName: "getCalendar", input: {}},
			],
		},
		{
			role: "tool",
			content: [
				{
					type: "tool-result",
					toolCallId: "c",
					toolName: "getCalendar",
					output: {type: "json", value: {year: "2026"}},
				},
			],
		},
		{role: "user", content: [{type: "text", text: "and next?"}]},
	];
	expect(toChatMessages(prompt)[0].reasoning_content).toBe("prior thinking");
	expect(() => toChatMessages([prompt[0], prompt[2]])).toThrow("Incomplete");
	expect(() => toChatMessages([prompt[1]])).toThrow("Orphan");
});

test("only sends campus chat/completions parameters and rejects unverified thinking", async () => {
	const {transport, bodies} = scripted([{text: "ok"}]);
	const model = createCampusModel(campusModel, transport);
	await model.doGenerate({prompt: [{role: "user", content: [{type: "text", text: "hi"}]}]});
	expect(bodies[0]).toMatchObject({model: "DeepSeek-V4-Flash", stream: true});
	expect(bodies[0]).not.toHaveProperty("reasoning_effort");
	expect(bodies[0]).not.toHaveProperty("thinking");
	expect(() => createCampusModel(campusModel, transport, "high")).toThrow();
});
