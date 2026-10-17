import type {AgentSession, ToolInvocation} from "./types";
import {MAX_RESULT_BYTES} from "./types";
import {sanitize, truncateBytes} from "./util";

export const toolDetail = (value: unknown): string =>
	truncateBytes(JSON.stringify(sanitize(value), null, 2), MAX_RESULT_BYTES);

export const findToolInvocation = (session: AgentSession, id: string) => {
	// Providers may reuse read IDs after the replayable protocol has been reset.
	for (const message of [...session.messages].reverse()) {
		const invocation = message.toolInvocations?.find(
			(entry) => entry.id === id,
		);
		if (invocation) return invocation;
	}
};

/** Business receipts and native decisions take precedence over SDK completion. */
export const syncToolActivity = (session: AgentSession, now = Date.now()) => {
	const checkpoint = session.checkpoint;
	for (const message of session.messages) {
		for (const invocation of message.toolInvocations ?? []) {
			const operation = checkpoint.operations.find(
				({id, tool}) => id === invocation.id && tool === invocation.tool,
			);
			const approval = checkpoint.approvals.find(
				({toolCallId, tool, consumed}) =>
					toolCallId === invocation.id && tool === invocation.tool && !consumed,
			);
			if (operation) {
				invocation.status =
					operation.status === "dispatching" ? "running" : operation.status;
			} else if (approval && !approval.decision) {
				invocation.status = "awaiting_approval";
			} else if (approval?.decision === "denied") {
				invocation.status = "denied";
			} else if (
				checkpoint.pendingInput?.toolCallId === invocation.id &&
				findToolInvocation(session, invocation.id) === invocation
			) {
				invocation.status = "awaiting_input";
			} else if (invocation.status === "awaiting_input") {
				invocation.status = "succeeded";
				if (message.processingStatus === "awaiting_input")
					message.processingStatus = "completed";
			} else if (
				approval?.decision === "approved" &&
				["awaiting_approval", "pending"].includes(invocation.status)
			) {
				invocation.status = "pending";
			} else if (
				checkpoint.status !== "running" &&
				["pending", "running"].includes(invocation.status)
			) {
				invocation.status = "interrupted";
			}
			if (
				!["pending", "running", "awaiting_approval", "awaiting_input"].includes(
					invocation.status,
				)
			) {
				invocation.completedAt ??= now;
			}
		}
	}
	const last = session.messages.at(-1);
	if (last?.role === "assistant") last.processingStatus = checkpoint.status;
};

export const resultStatus = (output: unknown): ToolInvocation["status"] => {
	if (output && typeof output === "object" && "status" in output) {
		const status = output.status;
		if (
			status === "failed" ||
			status === "unknown" ||
			status === "denied" ||
			status === "handoff"
		) {
			return status;
		}
	}
	return "succeeded";
};
