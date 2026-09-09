import type {ToolDescriptor} from "@thu-info/lib/src/agent";
import type {AgentSession, Approval, ToolContext} from "./types";
import {AgentPaused, AgentToolError, canonical, fingerprint, sanitize, truncateBytes} from "./util";
import {ResultStore, ToolRegistry} from "./registry";

export class ToolExecutor {
	private queue: Promise<unknown> = Promise.resolve();
	readonly results = new ResultStore();
	constructor(
		private session: AgentSession,
		private registry: ToolRegistry,
		private context: ToolContext,
		private persist: () => Promise<void>,
		private now = Date.now,
	) {}
	private serial<T>(action: () => Promise<T>) {
		const next = this.queue.then(action);
		this.queue = next.catch(() => {});
		return next;
	}
	private operationKey(tool: ToolDescriptor, args: Record<string, unknown>) {
		return fingerprint({
			account: this.context.account,
			run: this.session.checkpoint.runId,
			tool: tool.name,
			version: tool.version,
			args,
		});
	}
	private approvalKey(tool: ToolDescriptor, args: Record<string, unknown>, preview: string) {
		return fingerprint({operation: this.operationKey(tool, args), preview});
	}
	private async prepare(tool: ToolDescriptor, args: Record<string, unknown>) {
		try {
			return await this.context.prepare(tool, args);
		} catch (error) {
			if (error instanceof AgentToolError) {
				throw error;
			}
			throw new Error(
				"Unable to verify this action. Check the native screen and your login before requesting approval again.",
			);
		}
	}
	private previous(tool: ToolDescriptor, args: Record<string, unknown>) {
		return this.session.checkpoint.operations.find(
			(op) =>
				op.fingerprint === this.operationKey(tool, args) ||
				(["unknown", "dispatching"].includes(op.status) &&
					op.account === this.context.account &&
					op.tool === tool.name &&
					(op.targetFingerprint ?? fingerprint(op.args)) === fingerprint(args)),
		);
	}
	private assertRunning(tool: ToolDescriptor) {
		this.context.assertAccess(tool);
		if (this.session.checkpoint.status !== "running") {
			throw new AgentPaused();
		}
	}
	private validate(name: string, args: Record<string, unknown>) {
		const descriptor = this.registry.validate(name, args);
		if (canonical(sanitize(args)) !== canonical(args)) {
			throw new Error(
				"Sensitive arguments cannot be passed through the agent; use the native screen",
			);
		}
		return descriptor;
	}
	private needsApproval(tool: ToolDescriptor, args: Record<string, unknown>) {
		const batch = this.session.checkpoint.operations.some(
			(op) =>
				op.runId === this.session.checkpoint.runId &&
				op.tool === tool.name &&
				op.fingerprint !== this.operationKey(tool, args),
		);
		return (
			tool.impact === "confirm" || batch || this.context.confirmationRequired?.(tool, args) === true
		);
	}

	approvalStatus(
		name: string,
		args: Record<string, unknown>,
		toolCallId: string,
	): Promise<"not-applicable" | "user-approval" | "denied"> {
		return this.serial(async () => {
			const tool = this.validate(name, args);
			this.assertRunning(tool);
			if (tool.effect === "read") {
				return "not-applicable";
			}
			if (this.session.checkpoint.answerOnly) {
				return "denied";
			}
			const previous = this.previous(tool, args);
			if (previous) {
				return ["unknown", "dispatching", "denied"].includes(previous.status)
					? "denied"
					: "not-applicable";
			}
			if (!this.needsApproval(tool, args)) {
				return "not-applicable";
			}
			const preview = await this.prepare(tool, args);
			this.assertRunning(tool);
			const digest = this.approvalKey(tool, args, preview);
			const old = this.session.checkpoint.approvals.find(
				(approval) => approval.toolCallId === toolCallId,
			);
			if (
				old?.fingerprint === digest &&
				old.expiresAt > this.now() &&
				old.decision === "approved" &&
				!old.consumed
			) {
				return "not-applicable";
			}
			if (old?.fingerprint === digest && old.expiresAt > this.now() && old.decision === "denied") {
				return "denied";
			}
			const approval: Approval = {
				id: toolCallId,
				toolCallId,
				tool: tool.name,
				version: tool.version,
				runId: this.session.checkpoint.runId,
				account: this.context.account,
				args: JSON.parse(canonical(args)),
				preview,
				fingerprint: digest,
				createdAt: this.now(),
				expiresAt: this.now() + 10 * 60 * 1000,
			};
			this.session.checkpoint.approvals = this.session.checkpoint.approvals
				.filter((item) => item.toolCallId !== toolCallId)
				.concat(approval);
			await this.persist();
			return "user-approval";
		});
	}

	/** Called only by native UI handlers; model text never enters this method. */
	async decide(approvalId: string, approved: boolean): Promise<Approval> {
		return this.serial(async () => {
			const approval = this.session.checkpoint.approvals.find((item) => item.id === approvalId);
			if (
				!approval ||
				approval.decision ||
				approval.consumed ||
				approval.account !== this.context.account ||
				approval.runId !== this.session.checkpoint.runId
			) {
				throw new Error("Approval is no longer valid");
			}
			const tool = this.registry.get(approval.tool);
			if (!tool) {
				throw new Error("Tool is no longer available");
			}
			this.context.assertAccess(tool);
			if (approved) {
				if (approval.expiresAt <= this.now() || tool.version !== approval.version) {
					throw new Error(
						"Approval expired; reject this action and ask again for an updated preview",
					);
				}
				const preview = await this.prepare(tool, approval.args);
				if (approval.fingerprint !== this.approvalKey(tool, approval.args, preview)) {
					throw new Error(
						"The target changed; reject this action and ask again for an updated preview",
					);
				}
			}
			approval.decision = approved ? "approved" : "denied";
			if (!approved) {
				this.session.checkpoint.operations.push({
					id: approval.toolCallId,
					tool: tool.name,
					label: tool.description.split(".")[0],
					status: "denied",
					preview: approval.preview,
					timestamp: this.now(),
					runId: approval.runId,
					account: approval.account,
					fingerprint: this.operationKey(tool, approval.args),
					args: approval.args,
				});
			}
			await this.persist();
			return approval;
		});
	}

	execute(name: string, args: Record<string, unknown>, toolCallId: string): Promise<unknown> {
		return this.serial(async () => {
			const tool = this.validate(name, args);
			this.assertRunning(tool);
			if (tool.effect === "read") {
				if (tool.lock) {
					this.session.checkpoint.protectedTools = [
						...new Set([...(this.session.checkpoint.protectedTools ?? []), name]),
					];
					await this.persist();
				}
				let result: unknown;
				try {
					result = await this.context.invoke(tool, args);
				} catch (error) {
					if (error instanceof AgentToolError) {
						throw error;
					}
					// Portal errors can contain raw HTML or authentication payloads.
					throw new Error(
						"Portal read failed. Check the corresponding native screen and your login, then retry.",
					);
				}
				this.assertRunning(tool);
				return this.results.put(result);
			}
			if (this.session.checkpoint.answerOnly) {
				throw new Error("Answer regeneration cannot perform writes");
			}
			const digest = this.operationKey(tool, args);
			const previous = this.previous(tool, args);
			if (previous) {
				return {
					status: previous.status,
					alreadyAttempted: true,
					result: previous.result,
					instruction:
						"Do not repeat this operation. Verify unknown outcomes with a read or native screen.",
				};
			}
			// Revalidate immediately before dispatch, even after SDK approval processing.
			const preview = await this.prepare(tool, args);
			this.assertRunning(tool);
			if (this.needsApproval(tool, args)) {
				const approval = this.session.checkpoint.approvals.find(
					(item) => item.toolCallId === toolCallId,
				);
				if (
					!approval ||
					approval.decision !== "approved" ||
					approval.consumed ||
					approval.account !== this.context.account ||
					approval.runId !== this.session.checkpoint.runId ||
					approval.version !== tool.version ||
					approval.expiresAt <= this.now() ||
					approval.fingerprint !== this.approvalKey(tool, args, preview)
				) {
					throw new Error("A valid, unchanged, single-use approval is required");
				}
				approval.consumed = true;
			}
			const operation = {
				id: toolCallId,
				tool: name,
				label: tool.description.split(".")[0],
				status: "dispatching" as const,
				preview,
				timestamp: this.now(),
				runId: this.session.checkpoint.runId,
				account: this.context.account,
				fingerprint: digest,
				targetFingerprint: fingerprint(args),
				args: JSON.parse(canonical(args)),
			};
			this.session.checkpoint.operations.push(operation);
			await this.persist();
			this.assertRunning(tool);
			const record =
				this.session.checkpoint.operations[this.session.checkpoint.operations.length - 1];
			try {
				const output = await this.context.invoke(tool, args);
				const result = this.results.put(output);
				const handoff =
					output !== null &&
					typeof output === "object" &&
					"status" in output &&
					output.status === "handoff";
				const failed =
					output === false ||
					(output &&
						typeof output === "object" &&
						"status" in output &&
						output.status === "failed");
				const unknown =
					output && typeof output === "object" && "status" in output && output.status === "unknown";
				record.status = unknown ? "unknown" : handoff ? "handoff" : failed ? "failed" : "succeeded";
				if (unknown) {
					this.session.checkpoint.status = "paused";
				}
				record.result = truncateBytes(JSON.stringify(sanitize(result)), 2048);
				// Commit the remote result before any UI refresh that can itself fail.
				await this.persist();
				if (!handoff && record.status === "succeeded") {
					try {
						this.context.assertAccess(tool);
						await this.context.onMutation(tool);
					} catch {
						record.result +=
							" (Action completed; refresh the affected screen to update its display.)";
					}
				}
				if (handoff) {
					this.session.checkpoint.status = "awaiting_input";
					this.session.checkpoint.pendingInput = {
						toolCallId,
						question:
							"Complete the operation in the opened screen, then tell me its outcome. Opening the screen does not confirm completion.",
					};
				}
				await this.persist();
				return result;
			} catch {
				record.status = "unknown";
				record.result =
					"Outcome unknown. Check the relevant campus records or native screen before attempting this operation again.";
				this.session.checkpoint.status = "paused";
				await this.persist();
				return {status: "unknown", instruction: record.result};
			}
		});
	}
}
