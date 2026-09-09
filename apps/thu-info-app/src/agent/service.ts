import {AppState} from "react-native";
import {currState, helper, store} from "../redux/store";
import {configSet} from "../redux/slices/config";
import {deepseekMigrationComplete} from "../redux/slices/deepseek";
import {AgentRuntime} from "./runtime";
import {newSession, SessionStore} from "./storage";
import {nativeSessionStorage} from "./nativeStorage";
import {nativeCompletionTransport} from "./nativeTransport";
import {createNativeToolContext, sessionNeedsUnlock} from "./nativeTools";

/** At most one active runner. Native portal cookies belong to the logged-in account. */
class AgentService {
	private current?: AgentRuntime;
	private stores = new Map<string, SessionStore>();
	private initialized = false;
	private token?: {account: string; value: string; checkedAt: number};
	private queue: Promise<unknown> = Promise.resolve();
	private serial<T>(action: () => Promise<T>) {
		const result = this.queue.then(action);
		this.queue = result.catch(() => {});
		return result;
	}
	private observe() {
		if (this.initialized) {
			return;
		}
		this.initialized = true;
		const pause = () => {
			if (this.current?.isRunning()) {
				void this.current.stop().catch(() => {});
			}
		};
		AppState.addEventListener("change", (state) => {
			if (state !== "active") {
				pause();
			}
		});
		store.subscribe(() => {
			const state = currState();
			if (
				state.auth.userId !== this.current?.session.header.account ||
				state.config.appLocked ||
				!state.config.agentEnabled ||
				(this.current && sessionNeedsUnlock(this.current.session.checkpoint))
			) {
				pause();
				this.current?.executor.results.clear();
			}
			if (state.auth.userId !== this.token?.account) {
				this.token = undefined;
			}
		});
	}
	forAccount(account = currState().auth.userId) {
		if (!account) {
			throw new Error("Sign in to use agent conversations");
		}
		this.observe();
		let sessions = this.stores.get(account);
		if (!sessions) {
			sessions = new SessionStore(nativeSessionStorage, account);
			this.stores.set(account, sessions);
		}
		return sessions;
	}
	private async getToken(account: string) {
		if (currState().auth.userId !== account || helper.userId !== account) {
			throw new Error("Account changed");
		}
		if (this.token?.account === account && Date.now() - this.token.checkedAt < 5 * 60 * 1000) {
			return this.token.value;
		}
		// Legacy persisted tokens are not account-tagged; never reuse one across accounts.
		const value = await helper.getMadModelToken().catch(() => {
			throw new Error("Unable to authorize the campus model. Check your login and connection.");
		});
		if (currState().auth.userId !== account || helper.userId !== account) {
			throw new Error("Account changed");
		}
		this.token = {account, value, checkedAt: Date.now()};
		store.dispatch(configSet({key: "deepseekToken", value}));
		return value;
	}
	open(id?: string, create = false): Promise<AgentRuntime> {
		const account = currState().auth.userId;
		return this.serial(async () => {
			const sessions = this.forAccount(account);
			if (
				this.current?.session.header.account === account &&
				!create &&
				(!id || this.current.session.header.id === id)
			) {
				return this.current;
			}
			if (this.current) {
				await this.current.stopAndWait();
				this.current.executor.results.clear();
			}
			// Crash-interrupted running checkpoints must become paused before maintenance.
			for (const header of await sessions.list(0, Number.MAX_SAFE_INTEGER)) {
				if (header.status === "running") {
					const interrupted = await sessions.load(header.id);
					if (interrupted) {
						await sessions.save(interrupted);
					}
				}
			}
			await sessions.migrate(currState().deepseek.history);
			if (currState().auth.userId !== account) {
				throw new Error("Account changed during migration; original history was retained");
			}
			store.dispatch(deepseekMigrationComplete());
			await sessions.cleanup();
			const target = id ?? (create ? undefined : (await sessions.list(0, 1))[0]?.id);
			const session = target
				? await sessions.load(target)
				: newSession(account, "New conversation");
			if (!session) {
				throw new Error("Conversation no longer exists");
			}
			await sessions.save(session);
			this.current = new AgentRuntime(
				session,
				sessions,
				createNativeToolContext(account, () => session.checkpoint.newsSource),
				nativeCompletionTransport(() => this.getToken(account)),
			);
			return this.current;
		});
	}
	clear(account: string) {
		return this.serial(async () => {
			if (this.current?.session.header.account === account) {
				await this.current.stopAndWait();
				this.current.executor.results.clear();
				this.current = undefined;
			}
			await this.forAccount(account).clear();
		});
	}
	remove(id: string) {
		const account = currState().auth.userId;
		return this.serial(async () => {
			if (
				this.current?.session.header.id === id &&
				this.current.session.header.account === account
			) {
				await this.current.stopAndWait();
				this.current = undefined;
			}
			await this.forAccount(account).remove(id);
			await this.forAccount(account).cleanup();
		});
	}
	clearDetails() {
		const account = currState().auth.userId;
		return this.serial(async () => {
			if (this.current) {
				await this.current.stopAndWait();
				this.current = undefined;
			}
			await this.forAccount(account).cleanup(true);
		});
	}
}

export const agentService = new AgentService();
