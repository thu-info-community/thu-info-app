import type {
	LanguageModelV4,
	LanguageModelV4CallOptions,
	LanguageModelV4Content,
	LanguageModelV4FinishReason,
	LanguageModelV4StreamPart,
	LanguageModelV4Usage,
} from "@ai-sdk/provider";
import type {AssistantModelMessage, ModelMessage} from "ai";
import type {ModelCapabilities, ThinkingLevel} from "./types";
import {byteLength} from "./util";

export interface ChatWireMessage {
	role: "system" | "user" | "assistant" | "tool";
	content: string | null;
	reasoning_content?: string;
	tool_calls?: {id: string; type: "function"; function: {name: string; arguments: string}}[];
	tool_call_id?: string;
}

export type CompletionTransport = (
	body: Record<string, unknown>,
	signal: AbortSignal | undefined,
	onData: (data: string) => void,
) => Promise<void>;

export const toChatMessages = (prompt: LanguageModelV4CallOptions["prompt"]): ChatWireMessage[] => {
	const messages: ChatWireMessage[] = [];
	for (const message of prompt) {
		if (message.role === "system") {
			messages.push({role: "system", content: message.content});
		} else if (message.role === "user") {
			if (message.content.some((part) => part.type !== "text")) {
				throw new Error("The campus agent supports text input only");
			}
			messages.push({
				role: "user",
				content: message.content
					.filter((p) => p.type === "text")
					.map((p) => p.text)
					.join(""),
			});
		} else if (message.role === "assistant") {
			const calls = message.content
				.filter((p) => p.type === "tool-call")
				.map((p) => ({
					id: p.toolCallId,
					type: "function" as const,
					function: {name: p.toolName, arguments: JSON.stringify(p.input)},
				}));
			messages.push({
				role: "assistant",
				content:
					message.content
						.filter((p) => p.type === "text")
						.map((p) => p.text)
						.join("") || null,
				reasoning_content: message.content
					.filter((p) => p.type === "reasoning")
					.map((p) => p.text)
					.join(""),
				...(calls.length ? {tool_calls: calls} : {}),
			});
		} else {
			for (const part of message.content) {
				if (part.type !== "tool-result") {
					continue; // SDK approval messages are local control state, never API roles.
				}
				messages.push({
					role: "tool",
					tool_call_id: part.toolCallId,
					content:
						"value" in part.output
							? typeof part.output.value === "string"
								? part.output.value
								: JSON.stringify(part.output.value)
							: JSON.stringify(part.output),
				});
			}
		}
	}
	const pending = new Set<string>();
	for (const message of messages) {
		if (message.role !== "tool" && pending.size) {
			throw new Error("Incomplete tool exchange; resume or resolve pending actions first");
		}
		for (const call of message.tool_calls ?? []) {
			if (pending.has(call.id)) {
				throw new Error("Duplicate tool call identifier");
			}
			pending.add(call.id);
		}
		if (
			message.role === "tool" &&
			(!message.tool_call_id || !pending.delete(message.tool_call_id))
		) {
			throw new Error("Orphan tool result");
		}
	}
	if (pending.size) {
		throw new Error("Missing tool results");
	}
	return messages;
};

const emptyUsage = (): LanguageModelV4Usage => ({
	inputTokens: {total: undefined, noCache: undefined, cacheRead: undefined, cacheWrite: undefined},
	outputTokens: {total: undefined, text: undefined, reasoning: undefined},
});

/** Stateful SSE decoder. No executable tool call is emitted until a complete finish. */
export class CompletionDecoder {
	text = "";
	reasoning = "";
	finish: string | undefined;
	usage = emptyUsage();
	private calls = new Map<number, {id: string; name: string; arguments: string}>();
	private textStarted = false;
	private reasoningStarted = false;
	done = false;

	constructor(private emit: (part: LanguageModelV4StreamPart) => void = () => {}) {}

	push(data: string) {
		if (this.done) {
			return;
		}
		if (data.trim() === "[DONE]") {
			this.done = true;
			return;
		}
		const chunk = JSON.parse(data);
		if (chunk.error || chunk.errorMessage) {
			throw new Error("Campus model returned an error");
		}
		if (chunk.usage) {
			this.usage = {
				inputTokens: {
					total: chunk.usage.prompt_tokens,
					noCache: undefined,
					cacheRead: chunk.usage.prompt_cache_hit_tokens,
					cacheWrite: undefined,
				},
				outputTokens: {
					total: chunk.usage.completion_tokens,
					text: undefined,
					reasoning: chunk.usage.completion_tokens_details?.reasoning_tokens,
				},
			};
		}
		const choice = chunk.choices?.[0];
		if (!choice) {
			return;
		}
		if (choice.finish_reason != null) {
			this.finish = choice.finish_reason;
		}
		const delta = choice.delta ?? {};
		for (const [field, reasoning] of [
			["content", false],
			["reasoning_content", true],
		] as const) {
			if (delta[field] == null) {
				continue;
			}
			if (typeof delta[field] !== "string") {
				throw new Error("Invalid completion delta");
			}
			if (reasoning) {
				if (!this.reasoningStarted) {
					this.emit({type: "reasoning-start", id: "reasoning"});
					this.reasoningStarted = true;
				}
				this.reasoning += delta[field];
				this.emit({type: "reasoning-delta", id: "reasoning", delta: delta[field]});
			} else {
				if (!this.textStarted) {
					this.emit({type: "text-start", id: "text"});
					this.textStarted = true;
				}
				this.text += delta[field];
				this.emit({type: "text-delta", id: "text", delta: delta[field]});
			}
		}
		for (const call of delta.tool_calls ?? []) {
			if (!Number.isInteger(call.index) || call.index < 0 || call.index >= 16) {
				throw new Error("Invalid tool call index");
			}
			const current = this.calls.get(call.index) ?? {id: "", name: "", arguments: ""};
			if (call.id) {
				if (current.id && current.id !== call.id) {
					throw new Error("Tool call identifier changed mid-stream");
				}
				current.id = call.id;
			}
			if (call.function?.name) {
				current.name += call.function.name;
			}
			if (call.function?.arguments) {
				current.arguments += call.function.arguments;
			}
			if (byteLength(current.arguments) > 65536) {
				throw new Error("Tool arguments exceed the size limit");
			}
			this.calls.set(call.index, current);
		}
		if (byteLength(this.text) + byteLength(this.reasoning) > 1024 * 1024) {
			throw new Error("Completion exceeds the size limit");
		}
	}

	complete(): {content: LanguageModelV4Content[]; finishReason: LanguageModelV4FinishReason} {
		if (!this.finish) {
			throw new Error("The completion stream ended before a finish reason");
		}
		const content: LanguageModelV4Content[] = [];
		if (this.reasoning) {
			content.push({type: "reasoning", text: this.reasoning});
		}
		if (this.text) {
			content.push({type: "text", text: this.text});
		}
		if (this.calls.size && this.finish !== "tool_calls") {
			throw new Error("Incomplete tool call; no action was executed");
		}
		const ids = new Set<string>();
		for (const [, call] of [...this.calls].sort(([a], [b]) => a - b)) {
			if (!call.id || ids.has(call.id) || !/^[a-zA-Z0-9_-]{1,64}$/.test(call.name)) {
				throw new Error("Invalid tool call identity");
			}
			const input = JSON.parse(call.arguments);
			if (!input || typeof input !== "object" || Array.isArray(input)) {
				throw new Error("Tool arguments must be an object");
			}
			ids.add(call.id);
			content.push({
				type: "tool-call",
				toolCallId: call.id,
				toolName: call.name,
				input: call.arguments,
			});
		}
		return {
			content,
			finishReason: {
				raw: this.finish,
				unified:
					this.finish === "tool_calls"
						? "tool-calls"
						: this.finish === "length"
							? "length"
							: this.finish === "stop"
								? "stop"
								: "other",
			},
		};
	}
}

export const createCampusModel = (
	capabilities: ModelCapabilities,
	transport: CompletionTransport,
	thinking: ThinkingLevel = "default",
	onAssistant?: (message: ModelMessage) => Promise<void>,
): LanguageModelV4 => {
	if (!capabilities.thinkingLevels.includes(thinking)) {
		throw new Error("This thinking level has not been verified for the campus endpoint");
	}
	const body = (options: LanguageModelV4CallOptions): Record<string, unknown> => {
		if (!capabilities.thinkingLevels.includes(thinking)) {
			throw new Error("This thinking level has not been verified for the campus endpoint");
		}
		const tools = options.tools?.map((tool) => {
			if (tool.type !== "function") {
				throw new Error("Only local function tools are supported");
			}
			return {
				type: "function",
				function: {name: tool.name, description: tool.description, parameters: tool.inputSchema},
			};
		});
		return {
			model: capabilities.model,
			messages: toChatMessages(options.prompt),
			stream: true,
			max_tokens: options.maxOutputTokens ?? capabilities.maxOutputTokens,
			...(tools?.length
				? {
						tools,
						tool_choice:
							options.toolChoice?.type === "tool"
								? {type: "function", function: {name: options.toolChoice.toolName}}
								: (options.toolChoice?.type ?? "auto"),
					}
				: {}),
			...(thinking === "off"
				? {thinking: {type: "disabled"}}
				: thinking === "default"
					? {}
					: {thinking: {type: "enabled"}, reasoning_effort: thinking}),
		};
	};
	return {
		specificationVersion: "v4",
		provider: "thu-campus",
		modelId: capabilities.model,
		supportedUrls: {},
		async doGenerate(options) {
			const decoder = new CompletionDecoder(() => {});
			await transport(body(options), options.abortSignal, (data) => decoder.push(data));
			return {...decoder.complete(), usage: decoder.usage, warnings: []};
		},
		async doStream(options) {
			const abort = new AbortController();
			const relay = () => abort.abort();
			options.abortSignal?.addEventListener("abort", relay, {once: true});
			if (options.abortSignal?.aborted) {
				abort.abort();
			}
			return {
				stream: new ReadableStream<LanguageModelV4StreamPart>({
					start(controller) {
						const decoder = new CompletionDecoder((part) => controller.enqueue(part));
						controller.enqueue({type: "stream-start", warnings: []});
						void (async () => {
							try {
								await transport(body(options), abort.signal, (data) => decoder.push(data));
								const result = decoder.complete();
								const assistant: ModelMessage = {
									role: "assistant",
									content: result.content.flatMap<
										Exclude<AssistantModelMessage["content"], string>[number]
									>((part) => {
										if (part.type === "text" || part.type === "reasoning") {
											return [part];
										}
										if (part.type === "tool-call") {
											return [
												{
													type: "tool-call" as const,
													toolCallId: part.toolCallId,
													toolName: part.toolName,
													input: JSON.parse(part.input),
												},
											];
										}
										return [];
									}),
								};
								// Durability precedes exposing executable calls to the SDK.
								await onAssistant?.(assistant);
								if (decoder.reasoning) {
									controller.enqueue({type: "reasoning-end", id: "reasoning"});
								}
								if (decoder.text) {
									controller.enqueue({type: "text-end", id: "text"});
								}
								for (const part of result.content) {
									if (part.type === "tool-call") {
										controller.enqueue(part);
									}
								}
								controller.enqueue({
									type: "finish",
									finishReason: result.finishReason,
									usage: decoder.usage,
								});
								controller.close();
							} catch (error) {
								controller.error(error);
							} finally {
								options.abortSignal?.removeEventListener("abort", relay);
							}
						})();
					},
					cancel() {
						abort.abort();
					},
				}),
			};
		},
	};
};
