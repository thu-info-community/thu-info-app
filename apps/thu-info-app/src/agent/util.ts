import {Buffer} from "buffer";
import md5 from "md5";

export const byteLength = (text: string) => Buffer.byteLength(text, "utf8");

export const truncateBytes = (text: string, maximum: number): string => {
	if (byteLength(text) <= maximum) {
		return text;
	}
	let result = "";
	let size = 0;
	for (const character of text) {
		size += byteLength(character);
		if (size > maximum - 3) {
			break;
		}
		result += character;
	}
	return result + "…";
};

export const canonical = (value: unknown): string => {
	if (value === null || typeof value !== "object") {
		return JSON.stringify(value) ?? "null";
	}
	if (Array.isArray(value)) {
		return `[${value.map(canonical).join(",")}]`;
	}
	return `{${Object.keys(value)
		.sort()
		.map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`)
		.join(",")}}`;
};

/** A local identity/deduplication digest, not a cryptographic authorization token. */
export const fingerprint = (value: unknown) => md5(canonical(value));

const sensitiveKey =
	/password|passwd|cookie|token|captcha|authorization|secret|fingerprint|__viewstate|csrf/i;

/** Last boundary before portal data reaches either the model or persistent traces. */
export const sanitize = (value: unknown, depth = 0): unknown => {
	if (depth > 12) {
		return "[nested result omitted]";
	}
	if (value === undefined || value === null) {
		return null;
	}
	if (typeof value === "string") {
		return value.replace(/Bearer\s+[A-Za-z0-9._~+/-]+/gi, "[credential omitted]");
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return value;
	}
	if (value instanceof Date) {
		return value.toISOString();
	}
	if (Array.isArray(value)) {
		return value.map((item) => sanitize(item, depth + 1));
	}
	if (typeof value === "object") {
		const object = value as Record<string, unknown>;
		if (typeof object.toISOString === "function") {
			return object.toISOString();
		}
		return Object.fromEntries(
			Object.entries(object)
				.filter(
					([key, item]) =>
						!sensitiveKey.test(key) &&
						typeof item !== "function" &&
						!["__proto__", "constructor", "prototype"].includes(key),
				)
				.map(([key, item]) => [key, sanitize(item, depth + 1)]),
		);
	}
	return null;
};

export class AgentPaused extends Error {
	constructor(message = "Run paused") {
		super(message);
		this.name = "AgentPaused";
	}
}

/** A controlled, safe-to-display wrapper/access error (not a raw portal response). */
export class AgentToolError extends Error {}
