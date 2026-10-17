import {v4 as uuid} from "uuid";
import type {
	AgentCheckpoint,
	AgentSession,
	Conversation,
	Message,
	SessionHeader,
	SessionStorage,
} from "./types";
import {DETAIL_TTL} from "./types";
import {byteLength, fingerprint, truncateBytes} from "./util";
import {extractMemory, presentMessage, resetProtocol} from "./context";
import {syncToolActivity} from "./activity";

interface Manifest {
	header: SessionHeader;
	pages: string[];
	checkpoint: string;
}

interface StoredMessage {
	message: Message;
	detail?: {key: string; createdAt: number};
}

interface MessageDetail {
	reasoning?: string;
	toolDetails?: {id: string; input?: string; output?: string}[];
}

/** One damaged conversation must not prevent access to other conversations. */
export class SessionDataError extends Error {}

/** Shared by disk maintenance and a runner kept open across the retention boundary. */
export const expireSessionDetails = (
	session: AgentSession,
	now = Date.now(),
	force = false,
) => {
	let changed = false;
	if (force || now - session.checkpoint.protocolCreatedAt >= DETAIL_TTL) {
		resetProtocol(session.checkpoint, extractMemory(session.checkpoint), now);
		session.checkpoint.approvals = [];
		if (
			!["completed", "idle", "cancelled"].includes(session.checkpoint.status)
		) {
			session.checkpoint.status = "paused";
		}
		changed = true;
	}
	const shrink = (action: {preview: string; result?: string}) => {
		const preview = truncateBytes(action.preview, 500);
		const result = action.result
			? truncateBytes(action.result, 512)
			: undefined;
		changed ||= preview !== action.preview || result !== action.result;
		action.preview = preview;
		action.result = result;
	};
	for (const message of session.messages) {
		const visible = presentMessage(message);
		changed ||=
			message.content !== visible.text ||
			message.reasoning !== visible.reasoning;
		message.content = visible.text;
		message.reasoning = visible.reasoning;
		if (
			force ||
			now - (message.timestamp ?? session.header.createdAt) >= DETAIL_TTL
		) {
			changed ||= message.reasoning !== undefined;
			delete message.reasoning;
			for (const invocation of message.toolInvocations ?? []) {
				changed ||=
					invocation.input !== undefined || invocation.output !== undefined;
				delete invocation.input;
				delete invocation.output;
			}
		}
	}
	for (const operation of session.checkpoint.operations) {
		if (force || now - operation.timestamp >= DETAIL_TTL) {
			changed ||= Object.keys(operation.args).length > 0;
			operation.args = {};
			shrink(operation);
		}
	}
	return changed;
};

export const newCheckpoint = (): AgentCheckpoint => ({
	version: 1,
	runId: uuid(),
	status: "idle",
	messages: [],
	activeTools: [],
	catalogPaths: [],
	protectedTools: [],
	summary: "",
	request: "",
	steps: 0,
	compactions: 0,
	updatedAt: Date.now(),
	protocolCreatedAt: Date.now(),
	approvals: [],
	operations: [],
});

export const newSession = (account: string, title: string): AgentSession => ({
	header: {
		id: uuid(),
		account,
		title,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		status: "idle",
		messageCount: 0,
	},
	messages: [],
	checkpoint: newCheckpoint(),
});

/**
 * Immutable content-addressed chunks followed by one atomic pointer update.
 * An interrupted write leaves the previous session valid. GC removes orphan chunks.
 */
export class SessionStore {
	private queue: Promise<unknown> = Promise.resolve();
	private knownChunks = new Set<string>();
	private writes = 0;
	constructor(
		private storage: SessionStorage,
		readonly account: string,
		private now = Date.now,
	) {}
	private prefix = () => `${fingerprint(this.account)}/`;
	private key = (id: string) => `pointer/${this.prefix()}${id}`;
	private serial<T>(action: () => Promise<T>): Promise<T> {
		const result = this.queue.then(action);
		this.queue = result.catch(() => {});
		return result;
	}
	private async json<T>(key: string): Promise<T | null> {
		const text = await this.storage.read(key);
		if (text === null) return null;
		try {
			return JSON.parse(text) as T;
		} catch {
			throw new SessionDataError("Saved conversation data is invalid");
		}
	}
	private async manifest(key: string): Promise<Manifest | null> {
		const manifest = await this.json<Manifest>(key);
		if (
			manifest &&
			(typeof manifest.header?.id !== "string" ||
				typeof manifest.header.account !== "string" ||
				typeof manifest.header.title !== "string" ||
				typeof manifest.checkpoint !== "string" ||
				!Array.isArray(manifest.pages) ||
				manifest.pages.some((page) => typeof page !== "string"))
		) {
			throw new SessionDataError("Saved conversation index is invalid");
		}
		return manifest;
	}
	private async chunk(value: unknown): Promise<string> {
		const text = JSON.stringify(value);
		const key = `chunk/${this.prefix()}${fingerprint(text)}`;
		if (!this.knownChunks.has(key) && (await this.storage.read(key)) === null) {
			await this.storage.write(key, text);
		}
		this.knownChunks.add(key);
		return key;
	}

	async list(offset = 0, limit = 100, search = ""): Promise<SessionHeader[]> {
		await this.queue;
		const keys = (await this.storage.keys()).filter((key) =>
			key.startsWith(`pointer/${this.prefix()}`),
		);
		const headers: SessionHeader[] = [];
		for (const key of keys) {
			let manifest: Manifest | null;
			try {
				manifest = await this.manifest(key);
			} catch (error) {
				if (error instanceof SessionDataError) continue;
				throw error;
			}
			if (
				manifest?.header.account === this.account &&
				manifest.header.title.toLowerCase().includes(search.toLowerCase())
			) {
				headers.push(manifest.header);
			}
		}
		return headers
			.sort((a, b) => b.updatedAt - a.updatedAt)
			.slice(offset, offset + limit);
	}

	async load(id: string): Promise<AgentSession | null> {
		await this.queue;
		return this.loadUnsafe(id);
	}
	private async loadUnsafe(id: string): Promise<AgentSession | null> {
		const manifest = await this.manifest(this.key(id));
		if (!manifest || manifest.header.account !== this.account) {
			return null;
		}
		const checkpoint = await this.json<AgentCheckpoint>(manifest.checkpoint);
		if (
			!checkpoint ||
			checkpoint.version !== 1 ||
			!Array.isArray(checkpoint.messages) ||
			!Array.isArray(checkpoint.operations) ||
			!Array.isArray(checkpoint.approvals) ||
			!Array.isArray(checkpoint.activeTools) ||
			!Array.isArray(checkpoint.catalogPaths) ||
			checkpoint.catalogPaths.some((path) => typeof path !== "string") ||
			!Array.isArray(checkpoint.protectedTools) ||
			checkpoint.protectedTools.some((name) => typeof name !== "string") ||
			checkpoint.operations.some(
				(operation) => typeof operation?.targetFingerprint !== "string",
			)
		) {
			throw new SessionDataError("Unsupported or incomplete agent checkpoint");
		}
		const messages: Message[] = [];
		for (const page of manifest.pages) {
			const entries = await this.json<string[]>(page);
			if (
				!Array.isArray(entries) ||
				entries.some((key) => typeof key !== "string")
			) {
				throw new SessionDataError("Conversation page is missing or invalid");
			}
			for (const key of entries) {
				const stored = await this.json<StoredMessage>(key);
				if (!stored?.message || typeof stored.message.content !== "string") {
					throw new SessionDataError(
						"Conversation message is missing or invalid",
					);
				}
				const detail =
					stored.detail && this.now() - stored.detail.createdAt < DETAIL_TTL
						? await this.json<MessageDetail>(stored.detail.key)
						: null;
				const message = {
					...stored.message,
					...(detail?.reasoning ? {reasoning: detail.reasoning} : {}),
				};
				message.toolInvocations = message.toolInvocations?.map(
					(invocation) => ({
						...invocation,
						...detail?.toolDetails?.find((entry) => entry.id === invocation.id),
					}),
				);
				messages.push(message);
			}
		}
		for (const operation of checkpoint.operations) {
			if (operation.status === "dispatching") {
				operation.status = "unknown";
				operation.result =
					"The app stopped before the result was recorded. Verify the outcome before retrying.";
			}
		}
		if (checkpoint.status === "running") {
			checkpoint.status = "paused";
		}
		const session = {
			header: {...manifest.header, status: checkpoint.status},
			checkpoint,
			messages,
		};
		syncToolActivity(session, this.now());
		return session;
	}

	save(session: AgentSession): Promise<void> {
		// Freeze the snapshot before it joins the write queue; streaming can continue in memory.
		const snapshot = JSON.parse(JSON.stringify(session)) as AgentSession;
		return this.serial(() => this.saveUnsafe(snapshot));
	}
	private async saveUnsafe(session: AgentSession) {
		if (session.header.account !== this.account) {
			throw new Error("Cannot save a different account's session");
		}
		const messageKeys: string[] = [];
		for (const message of session.messages) {
			const {text, reasoning} = presentMessage(message);
			const durable = {...message, content: text};
			delete durable.reasoning;
			const createdAt = message.timestamp ?? session.header.createdAt;
			const toolDetails = message.toolInvocations?.flatMap(
				({id, input, output}) =>
					input !== undefined || output !== undefined
						? [{id, input, output}]
						: [],
			);
			durable.toolInvocations = message.toolInvocations?.map(
				({input: _input, output: _output, ...invocation}) => invocation,
			);
			const detail =
				(reasoning || toolDetails?.length) &&
				this.now() - createdAt < DETAIL_TTL
					? {key: await this.chunk({reasoning, toolDetails}), createdAt}
					: undefined;
			messageKeys.push(
				await this.chunk({message: durable, ...(detail ? {detail} : {})}),
			);
		}
		const pages: string[] = [];
		for (let i = 0; i < messageKeys.length; i += 100) {
			pages.push(await this.chunk(messageKeys.slice(i, i + 100)));
		}
		session.header.messageCount = session.messages.length;
		session.header.status = session.checkpoint.status;
		const checkpoint = await this.chunk(session.checkpoint);
		const manifest: Manifest = {header: session.header, pages, checkpoint};
		await this.storage.write(
			this.key(session.header.id),
			JSON.stringify(manifest),
		);
		this.writes += 1;
		if (this.writes % 20 === 0) {
			try {
				await this.collectUnsafe();
			} catch {
				// The manifest was committed. Optional GC must not fail the saved request.
			}
		}
	}

	remove(id: string) {
		return this.serial(() => this.storage.remove(this.key(id)));
	}
	clear() {
		return this.serial(async () => {
			this.knownChunks.clear();
			for (const key of await this.storage.keys()) {
				if (
					key.startsWith(`pointer/${this.prefix()}`) ||
					key.startsWith(`chunk/${this.prefix()}`)
				) {
					await this.storage.remove(key);
				}
			}
		});
	}

	/** Native startup migration is idempotent; legacy Redux is cleared only after this returns. */
	async migrate(history: Conversation[]) {
		for (const old of history) {
			if (await this.load(old.id)) {
				continue;
			}
			const session = newSession(this.account, old.title);
			session.header.id = old.id;
			session.header.createdAt = old.timestamp ?? this.now();
			session.header.updatedAt = old.timestamp ?? this.now();
			session.messages = old.messages
				.filter(
					(message) => message.role === "user" || message.role === "assistant",
				)
				.map((message) => {
					return {
						id: uuid(),
						role: message.role,
						timestamp: message.timestamp ?? old.timestamp,
						content: presentMessage(message).text,
					};
				});
			session.checkpoint.request =
				[...session.messages]
					.reverse()
					.find((message) => message.role === "user")?.content ?? "";
			session.checkpoint.messages = session.messages.map((message) => ({
				role: message.role as "user" | "assistant",
				content: message.content,
			}));
			resetProtocol(
				session.checkpoint,
				extractMemory(session.checkpoint),
				this.now(),
			);
			session.checkpoint.status = "completed";
			await this.save(session);
			if (
				(await this.load(session.header.id))?.messages.length !==
				session.messages.length
			) {
				throw new Error("Conversation migration verification failed");
			}
		}
	}

	cleanup(clearAllDetails = false): Promise<void> {
		return this.serial(async () => {
			const pointers = (await this.storage.keys()).filter((key) =>
				key.startsWith(`pointer/${this.prefix()}`),
			);
			for (const key of pointers) {
				let session: AgentSession | null;
				try {
					const manifest = await this.manifest(key);
					if (!manifest || manifest.header.status === "running") continue;
					session = await this.loadUnsafe(manifest.header.id);
				} catch (error) {
					if (error instanceof SessionDataError) continue;
					throw error;
				}
				if (!session) continue;
				expireSessionDetails(session, this.now(), clearAllDetails);
				await this.saveUnsafe(session);
			}
			await this.collectUnsafe();
		});
	}

	private async collectUnsafe() {
		const keys = await this.storage.keys();
		const reachable = new Set<string>();
		for (const key of keys.filter((k) =>
			k.startsWith(`pointer/${this.prefix()}`),
		)) {
			try {
				const manifest = await this.manifest(key);
				if (!manifest) continue;
				if (!(await this.json<AgentCheckpoint>(manifest.checkpoint))) return;
				reachable.add(manifest.checkpoint);
				for (const page of manifest.pages) {
					reachable.add(page);
					const entries = await this.json<string[]>(page);
					if (
						!Array.isArray(entries) ||
						entries.some((entry) => typeof entry !== "string")
					)
						return;
					for (const message of entries) {
						reachable.add(message);
						const stored = await this.json<StoredMessage>(message);
						if (!stored?.message) return;
						if (stored.detail) reachable.add(stored.detail.key);
					}
				}
			} catch (error) {
				// A damaged graph may hide references. Preserve chunks for later recovery.
				if (error instanceof SessionDataError) return;
				throw error;
			}
		}
		for (const key of keys) {
			if (key.startsWith(`chunk/${this.prefix()}`) && !reachable.has(key)) {
				await this.storage.remove(key);
				this.knownChunks.delete(key);
			}
		}
	}

	async usage(): Promise<number> {
		await this.queue;
		let size = 0;
		for (const key of await this.storage.keys()) {
			if (key.includes(`/${this.prefix()}`)) {
				size += byteLength((await this.storage.read(key)) ?? "");
			}
		}
		return size;
	}
}
