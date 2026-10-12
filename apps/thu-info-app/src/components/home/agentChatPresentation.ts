import type {
	AgentCheckpoint,
	Message,
	RunStatus,
	ActionReceipt,
} from "../../agent/types";
import {presentMessage} from "../../agent/context";
import {langCode} from "../../utils/i18n";

export const agentText = (en: string, zh: string) =>
	langCode === "zh" ? zh : en;

export interface AgentTurn {
	id: string;
	role: "user" | "assistant";
	messages: Message[];
}

/** Group model steps for display only. The saved transcript remains unchanged. */
export const groupAgentMessages = (messages: Message[]): AgentTurn[] => {
	const turns: AgentTurn[] = [];
	for (const [index, message] of messages.entries()) {
		const role = message.role === "user" ? "user" : "assistant";
		const previous = turns.at(-1);
		if (role === "assistant" && previous?.role === "assistant") {
			previous.messages.push(message);
		} else {
			turns.push({
				id: message.id ?? `message-${index}`,
				role,
				messages: [message],
			});
		}
	}
	return turns;
};

export const agentStatusText = (status?: RunStatus): string => {
	switch (status) {
		case "running":
			return agentText("Working", "处理中");
		case "awaiting_approval":
			return agentText("Needs your approval", "等待你确认");
		case "awaiting_input":
			return agentText("Waiting for your reply", "等待你补充");
		case "paused":
			return agentText("Paused", "已暂停");
		case "failed":
			return agentText("Request interrupted", "请求中断");
		case "completed":
			return agentText("Completed", "已完成");
		case "cancelled":
			return agentText("Cancelled", "已取消");
		case "idle":
			return agentText("New conversation", "新对话");
		default:
			return agentText("Loading conversation", "正在载入对话");
	}
};

export const operationStatusText = (
	status: ActionReceipt["status"],
): string => {
	switch (status) {
		case "dispatching":
			return agentText("In progress", "正在执行");
		case "succeeded":
			return agentText("Succeeded", "已成功");
		case "failed":
			return agentText("Failed", "未成功");
		case "unknown":
			return agentText("Needs verification", "结果待核实");
		case "denied":
			return agentText("Declined", "已拒绝");
		case "handoff":
			return agentText("Opened in app", "已打开原生页面");
	}
};

/** Describe observed activity, without interpreting model prose as an action. */
export const agentProgressText = (checkpoint?: AgentCheckpoint): string => {
	if (!checkpoint || checkpoint.status !== "running")
		return agentStatusText(checkpoint?.status);
	const resolved = new Set(
		checkpoint.messages.flatMap((message) =>
			Array.isArray(message.content)
				? message.content.flatMap((part) =>
						part.type === "tool-result" ? [part.toolCallId] : [],
					)
				: [],
		),
	);
	for (const message of [...checkpoint.messages].reverse()) {
		if (!Array.isArray(message.content)) continue;
		for (const part of message.content) {
			if (part.type !== "tool-call" || resolved.has(part.toolCallId)) continue;
			if (part.toolName === "import_tools")
				return agentText("Checking available tools", "正在查看可用工具");
			if (part.toolName === "read_result")
				return agentText("Reading results", "正在读取结果");
			return agentText("Working with campus services", "正在处理校园事务");
		}
	}
	return agentText("Thinking and preparing a reply", "正在思考并整理回答");
};

export const turnContent = (turn: AgentTurn) => {
	const last = turn.messages.at(-1)!;
	const answer = presentMessage(last);
	const steps = turn.messages.flatMap((message, index) => {
		const visible = presentMessage(message);
		const text = [
			visible.reasoning,
			index < turn.messages.length - 1 ? visible.text : "",
		]
			.filter(Boolean)
			.join("\n\n");
		return text ? [{id: message.id ?? String(index), text}] : [];
	});
	return {answer: answer.text, steps};
};
