import type {ModelMessage} from "ai";
import type {JsonSchema, ToolDescriptor} from "@thu-info/lib/src/agent";

export type ThinkingLevel = "default" | "off" | "low" | "high" | "max";
export type RunStatus =
	| "idle"
	| "running"
	| "awaiting_approval"
	| "awaiting_input"
	| "paused"
	| "completed"
	| "cancelled"
	| "failed";

export interface ModelCapabilities {
	model: string;
	contextTokens: number;
	maxOutputTokens: number;
	thinkingLevels: ThinkingLevel[];
	/** Only reviewed gateway settings belong here; accepting a parameter is not proof it works. */
	verified: boolean;
}

export const campusModel: ModelCapabilities = {
	model: "DeepSeek-V4-Flash",
	contextTokens: 16384,
	maxOutputTokens: 4096,
	thinkingLevels: ["default"],
	verified: false,
};

export interface Message {
	id?: string;
	role: "system" | "user" | "assistant" | "tool";
	content: string;
	timestamp?: number;
	reasoning?: string;
	actions?: ActionReceipt[];
	documents?: {tool: string; route: string}[];
	tool_calls?: {id: string; type: "function"; function: {name: string; arguments: string}}[];
	tool_call_id?: string;
}

/** Also accepts the old Redux history for migration. */
export interface Conversation {
	id: string;
	title: string;
	messages: Message[];
	timestamp?: number;
}

export interface SessionHeader {
	id: string;
	account: string;
	title: string;
	createdAt: number;
	updatedAt: number;
	status: RunStatus;
	messageCount: number;
}

export interface ActionReceipt {
	id: string;
	tool: string;
	label: string;
	status: "dispatching" | "succeeded" | "failed" | "unknown" | "denied" | "handoff";
	preview: string;
	timestamp: number;
	result?: string;
}

export interface Operation extends ActionReceipt {
	runId: string;
	account: string;
	fingerprint: string;
	targetFingerprint?: string;
	args: Record<string, unknown>;
}

export interface Approval {
	id: string;
	toolCallId: string;
	tool: string;
	version: string;
	runId: string;
	account: string;
	args: Record<string, unknown>;
	preview: string;
	fingerprint: string;
	createdAt: number;
	expiresAt: number;
	decision?: "approved" | "denied";
	consumed?: boolean;
}

export interface PendingInput {
	toolCallId: string;
	question: string;
	choices?: string[];
}

export interface AgentCheckpoint {
	version: 1;
	runId: string;
	status: RunStatus;
	messages: ModelMessage[];
	activeTools: string[];
	summary: string;
	request: string;
	steps: number;
	compactions: number;
	updatedAt: number;
	protocolCreatedAt: number;
	thinking: ThinkingLevel;
	newsSource?: string | null;
	approvals: Approval[];
	operations: Operation[];
	/** A conversation that has read locked data stays subject to that lock. */
	protectedTools?: string[];
	pendingInput?: PendingInput;
	error?: string;
	/** Regeneration may revise prose, but cannot perform business writes. */
	answerOnly?: boolean;
}

export interface AgentSession {
	header: SessionHeader;
	messages: Message[];
	checkpoint: AgentCheckpoint;
}

export interface ToolContext {
	account: string;
	assertAccess: (tool?: ToolDescriptor) => void;
	prepare: (tool: ToolDescriptor, args: Record<string, unknown>) => Promise<string>;
	confirmationRequired?: (tool: ToolDescriptor, args: Record<string, unknown>) => boolean;
	invoke: (tool: ToolDescriptor, args: Record<string, unknown>) => Promise<unknown>;
	onMutation: (tool: ToolDescriptor) => Promise<void>;
}

export interface LocalTool extends ToolDescriptor {
	inputSchema: JsonSchema;
}

export interface SessionStorage {
	read: (key: string) => Promise<string | null>;
	write: (key: string, value: string) => Promise<void>;
	remove: (key: string) => Promise<void>;
	keys: () => Promise<string[]>;
}

export const DETAIL_TTL = 7 * 24 * 60 * 60 * 1000;
export const MAX_RESULT_BYTES = 4 * 1024;
