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

interface Manifest {
	header: SessionHeader;
	pages: string[];
	checkpoint: string;
}

interface StoredMessage {
	message: Message;
	detail?: {key: string; createdAt: number};
}

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
			(message.actions ?? []).forEach(shrink);
		}
	}
	for (const operation of session.checkpoint.operations) {
		if (force || now - operation.timestamp >= DETAIL_TTL) {
			changed ||=
				!operation.targetFingerprint || Object.keys(operation.args).length > 0;
			operation.targetFingerprint ??= fingerprint(operation.args);
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
	summary: "",
	request: "",
	steps: 0,
	compactions: 0,
	updatedAt: Date.now(),
	protocolCreatedAt: Date.now(),
	thinking: "default",
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
		return text === null ? null : (JSON.parse(text) as T);
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
			const manifest = await this.json<Manifest>(key);
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
		const manifest = await this.json<Manifest>(this.key(id));
		if (!manifest || manifest.header.account !== this.account) {
			return null;
		}
		const checkpoint = await this.json<AgentCheckpoint>(manifest.checkpoint);
		if (!checkpoint || checkpoint.version !== 1) {
			throw new Error("Unsupported or incomplete agent checkpoint");
		}
		const messages: Message[] = [];
		for (const page of manifest.pages) {
			const entries = await this.json<string[]>(page);
			if (!entries) {
				throw new Error("Conversation page is missing");
			}
			for (const key of entries) {
				const stored = await this.json<StoredMessage>(key);
				if (!stored) {
					throw new Error("Conversation message is missing");
				}
				let reasoning: string | undefined;
				if (
					stored.detail &&
					this.now() - stored.detail.createdAt < DETAIL_TTL
				) {
					reasoning = (await this.json<{reasoning: string}>(stored.detail.key))
						?.reasoning;
				}
				messages.push({...stored.message, ...(reasoning ? {reasoning} : {})});
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
		return {
			header: {...manifest.header, status: checkpoint.status},
			checkpoint,
			messages,
		};
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
			const detail =
				reasoning && this.now() - createdAt < DETAIL_TTL
					? {key: await this.chunk({reasoning}), createdAt}
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
			await this.collectUnsafe();
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
				const manifest = await this.json<Manifest>(key);
				if (!manifest || manifest.header.status === "running") {
					continue;
				}
				const session = await this.loadUnsafe(manifest.header.id);
				if (!session) {
					continue;
				}
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
			const manifest = await this.json<Manifest>(key);
			if (!manifest) {
				continue;
			}
			reachable.add(manifest.checkpoint);
			for (const page of manifest.pages) {
				reachable.add(page);
				for (const message of (await this.json<string[]>(page)) ?? []) {
					reachable.add(message);
					const stored = await this.json<StoredMessage>(message);
					if (stored?.detail) {
						reachable.add(stored.detail.key);
					}
				}
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
