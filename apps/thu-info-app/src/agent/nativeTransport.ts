import EventSource from "react-native-sse";
import {MADMODEL_BASE_URL} from "@thu-info/lib/src/constants/strings";
import type {CompletionTransport} from "./model";

/** Native SSE retains the app's WebVPN cookie behavior on all three platforms. */
export const nativeCompletionTransport =
	(getToken: () => Promise<string>): CompletionTransport =>
	async (body, signal, onData) => {
		const token = await getToken();
		if (signal?.aborted) {
			throw new Error("Request cancelled");
		}
		await new Promise<void>((resolve, reject) => {
			let settled = false;
			const source = new EventSource(`${MADMODEL_BASE_URL}/v1/chat/completions`, {
				method: "POST",
				headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
				body: JSON.stringify(body),
				pollingInterval: 0,
			});
			let timer: ReturnType<typeof setTimeout>;
			const finish = (error?: Error) => {
				if (settled) {
					return;
				}
				settled = true;
				clearTimeout(timer);
				signal?.removeEventListener("abort", abort);
				source.removeAllEventListeners();
				source.close();
				error ? reject(error) : resolve();
			};
			const abort = () => finish(new Error("Request cancelled"));
			const heartbeat = () => {
				clearTimeout(timer);
				timer = setTimeout(() => finish(new Error("Campus model stream timed out")), 90000);
			};
			heartbeat();
			signal?.addEventListener("abort", abort, {once: true});
			source.addEventListener("message", (event) => {
				if (!event.data) {
					return;
				}
				try {
					heartbeat();
					onData(event.data);
					if (event.data.trim() === "[DONE]") {
						finish();
					}
				} catch (error) {
					finish(error instanceof Error ? error : new Error("Invalid completion stream"));
				}
			});
			source.addEventListener("error", () =>
				finish(new Error("Campus model connection failed; check login and connection")),
			);
			source.addEventListener("close", () => finish());
		});
	};
