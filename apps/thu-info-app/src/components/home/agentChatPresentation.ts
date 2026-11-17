import type {
	AgentCheckpoint,
	Message,
	RunStatus,
	ToolInvocation,
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

export const toolLabel = (name: string): string => {
	switch (name) {
		case "import_tools":
			return agentText("Find tools", "查找可用工具");
		case "read_result":
			return agentText("Read results", "读取结果");
		case "request_user_input":
			return agentText("Ask for details", "询问补充信息");
		default:
			return name;
	}
};

export const toolStatusText = (status: ToolInvocation["status"]): string => {
	switch (status) {
		case "pending":
			return agentText("Queued", "等待执行");
		case "running":
			return agentText("Running", "正在执行");
		case "awaiting_approval":
			return agentText("Needs approval", "等待确认");
		case "awaiting_input":
			return agentText("Needs your reply", "等待补充");
		case "succeeded":
			return agentText("Completed", "已完成");
		case "failed":
			return agentText("Failed", "失败");
		case "unknown":
			return agentText("Needs verification", "结果待核实");
		case "denied":
			return agentText("Declined", "已拒绝");
		case "handoff":
			return agentText("Opened in app", "已打开原生页面");
		case "interrupted":
			return agentText("Interrupted", "已中断");
	}
};

export const activitySummary = (status: RunStatus, count: number): string => {
	const label =
		status === "running"
			? agentText("Thinking", "思考中")
			: agentStatusText(status);
	return count
		? `${label} · ${count} ${agentText(count === 1 ? "tool call" : "tool calls", "次工具调用")}`
		: label;
};

export const isVisibleTool = ({status}: ToolInvocation) =>
	[
		"pending",
		"running",
		"awaiting_approval",
		"awaiting_input",
		"failed",
		"unknown",
		"interrupted",
		"denied",
	].includes(status);

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

export type TurnActivity =
	| {kind: "thought"; id: string; text: string}
	| {kind: "tool"; id: string; invocation: ToolInvocation};

export const turnContent = (turn: AgentTurn) => {
	const last = turn.messages.at(-1)!;
	const answer = last.toolInvocations?.length ? "" : presentMessage(last).text;
	const seen = new Set<string>();
	const activities = turn.messages.flatMap<TurnActivity>((message, index) => {
		const visible = presentMessage(message);
		const text = [
			visible.reasoning,
			index < turn.messages.length - 1 || message.toolInvocations?.length
				? visible.text
				: "",
		]
			.filter(Boolean)
			.join("\n\n");
		const thought: TurnActivity[] = text
			? [{kind: "thought", id: message.id ?? String(index), text}]
			: [];
		return thought.concat(
			(message.toolInvocations ?? []).flatMap((invocation): TurnActivity[] => {
				const id = `${message.id ?? index}/${invocation.id}`;
				if (seen.has(id)) return [];
				seen.add(id);
				return [{kind: "tool", id, invocation}];
			}),
		);
	});
	return {
		answer,
		activities,
		toolCount: seen.size,
		status: last.processingStatus ?? "completed",
	};
};
