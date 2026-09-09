import {CompletionDecoder, type CompletionTransport} from "./model";
import type {ModelCapabilities} from "./types";

/** No campus data, no tool execution, no persisted prompt or response. */
export const probeToolSupport = async (
	transport: CompletionTransport,
	capabilities: ModelCapabilities,
	signal?: AbortSignal,
	disableThinking = false,
) => {
	const decoder = new CompletionDecoder();
	await transport(
		{
			model: capabilities.model,
			stream: true,
			max_tokens: capabilities.maxOutputTokens,
			...(disableThinking ? {thinking: {type: "disabled"}} : {}),
			messages: [
				{
					role: "system",
					content:
						"This is a harmless function-calling compatibility check. Call agent_compatibility_probe with value ok. Do not answer in prose.",
				},
				{role: "user", content: "Call the provided function now."},
			],
			tools: [
				{
					type: "function",
					function: {
						name: "agent_compatibility_probe",
						description:
							"Harmless local compatibility check. No data access or side effects.",
						parameters: {
							type: "object",
							properties: {value: {type: "string", enum: ["ok"]}},
							required: ["value"],
							additionalProperties: false,
						},
					},
				},
			],
			tool_choice: {
				type: "function",
				function: {name: "agent_compatibility_probe"},
			},
		},
		signal,
		(data) => decoder.push(data),
	);
	const response = decoder.complete();
	const calls = response.content.filter((part) => part.type === "tool-call");
	return calls.length === 1 &&
		calls[0].toolName === "agent_compatibility_probe" &&
		calls[0].input &&
		JSON.stringify(JSON.parse(calls[0].input)) === JSON.stringify({value: "ok"})
		? true
		: false;
};
