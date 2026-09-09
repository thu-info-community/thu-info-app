import {agentCatalog, validateSchema} from "@thu-info/lib/src/agent";
import type {JsonSchema, ToolDescriptor} from "@thu-info/lib/src/agent";
import {MAX_RESULT_BYTES} from "./types";
import {byteLength, fingerprint, sanitize, truncateBytes} from "./util";

const local = (
	name: string,
	description: string,
	inputSchema: JsonSchema,
	effect: "read" | "write" = "read",
	impact: "routine" | "confirm" = "routine",
): ToolDescriptor => ({
	name,
	path: `schedule.${name}`,
	category: "schedule",
	description,
	inputSchema,
	outputSchema: {},
	parameters: Object.keys(inputSchema.properties ?? {}),
	effect,
	impact,
	mode: "wrapper",
	version: "1",
});

export const localTools: ToolDescriptor[] = [
	local(
		"list_local_schedules",
		"List local schedules and their stable IDs, including custom events. Use before editing or syncing.",
		{type: "object", properties: {}, additionalProperties: false},
	),
	local(
		"create_schedule",
		"Create one requested local schedule. Supply either date or dayOfWeek; ask for missing dates/times. Recurring weeks refer to the current semester.",
		{
			type: "object",
			additionalProperties: false,
			properties: {
				title: {type: "string"},
				location: {type: "string"},
				date: {type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$"},
				dayOfWeek: {type: "integer", minimum: 1, maximum: 7},
				beginTime: {type: "string", pattern: "^([01][0-9]|2[0-3]):[0-5][0-9]$"},
				endTime: {type: "string", pattern: "^([01][0-9]|2[0-3]):[0-5][0-9]$"},
				weeks: {type: "array", items: {type: "integer", minimum: 1}, maxItems: 60},
			},
			required: ["title", "beginTime", "endTime"],
		},
		"write",
	),
	local(
		"delete_local_schedule",
		"Delete one custom local schedule or recurring series by stable ID. A recurring series requires confirmation.",
		{
			type: "object",
			properties: {scheduleId: {type: "string"}},
			required: ["scheduleId"],
			additionalProperties: false,
		},
		"write",
	),
];

export class ToolRegistry {
	private byName: Map<string, ToolDescriptor>;
	private active: string[] = [];
	constructor(descriptors = [...agentCatalog, ...localTools], active: string[] = []) {
		this.byName = new Map(descriptors.map((tool) => [tool.name, tool]));
		this.restore(active);
	}
	all() {
		return [...this.byName.values()];
	}
	get(name: string) {
		return this.byName.get(name);
	}
	activeNames() {
		return [...this.active];
	}
	activeSchemas() {
		return this.active
			.map((name) => this.byName.get(name)!)
			.map(({name, description, inputSchema}) => ({name, description, inputSchema}));
	}
	restore(names: string[]) {
		this.active = [...new Set(names)].filter((name) => this.byName.has(name)).slice(-16);
	}
	validate(name: string, args: unknown) {
		const tool = this.byName.get(name);
		if (!tool || !this.active.includes(name)) {
			throw new Error("Tool is unavailable; import its category and function first");
		}
		const error = validateSchema(tool.inputSchema, args);
		if (error) {
			throw new Error(error);
		}
		return tool;
	}
	import(path: string) {
		if (!path) {
			return [...new Set(this.all().map((tool) => tool.category))].map((category) => ({
				path: category,
				tools: this.all().filter((tool) => tool.category === category).length,
			}));
		}
		const leaf = this.all().find((tool) => tool.path === path);
		if (leaf) {
			this.active = this.active
				.filter((name) => name !== leaf.name)
				.concat(leaf.name)
				.slice(-16);
			return {
				imported: leaf.path,
				name: leaf.name,
				description: leaf.description,
				parameters: leaf.inputSchema,
				effect: leaf.effect,
				approval: leaf.impact,
			};
		}
		const category = this.all().filter((tool) => tool.category === path);
		if (!category.length) {
			throw new Error("Unknown tool path");
		}
		return category.map(({path: toolPath, description, effect, impact}) => ({
			path: toolPath,
			description: truncateBytes(description, 250),
			effect,
			approval: impact,
		}));
	}
}

/** Expanded results are transient, bounded, account-local and re-fetchable. */
export class ResultStore {
	private results = new Map<string, {value: unknown; bytes: number}>();
	private bytes = 0;
	clear() {
		this.results.clear();
		this.bytes = 0;
	}
	put(value: unknown): unknown {
		const safe = sanitize(value);
		const text = JSON.stringify(safe);
		const bytes = byteLength(text);
		if (bytes <= MAX_RESULT_BYTES && (!Array.isArray(safe) || safe.length <= 20)) {
			return safe;
		}
		const handle = fingerprint(text);
		if (bytes <= 2 * 1024 * 1024 && !this.results.has(handle)) {
			while (this.bytes + bytes > 4 * 1024 * 1024 && this.results.size) {
				const first = this.results.keys().next().value!;
				this.bytes -= this.results.get(first)!.bytes;
				this.results.delete(first);
			}
			this.results.set(handle, {value: safe, bytes});
			this.bytes += bytes;
		}
		return this.results.has(handle)
			? this.read(handle, 0)
			: {
					truncated: true,
					preview: truncateBytes(text, MAX_RESULT_BYTES - 256),
					instruction: "Narrow the query and fetch again; result was too large to retain.",
				};
	}
	read(handle: string, offset: number, field?: string): unknown {
		const result = this.results.get(handle);
		if (!result) {
			return {
				expired: true,
				instruction: "Fetch the source again; this transient result is no longer available.",
			};
		}
		let value = result.value;
		if (field) {
			if (
				!value ||
				typeof value !== "object" ||
				!Object.prototype.hasOwnProperty.call(value, field)
			) {
				throw new Error("Unknown result field");
			}
			value = (value as Record<string, unknown>)[field];
		}
		if (Array.isArray(value)) {
			const items: unknown[] = [];
			let size = 0;
			for (const item of value.slice(offset, offset + 20)) {
				const length = byteLength(JSON.stringify(item));
				if (size + length > MAX_RESULT_BYTES - 512) {
					if (!items.length) {
						return {
							handle,
							offset,
							preview: truncateBytes(JSON.stringify(item), MAX_RESULT_BYTES - 512),
							truncated: true,
							total: value.length,
						};
					}
					break;
				}
				items.push(item);
				size += length;
			}
			return {
				handle,
				field,
				items,
				total: value.length,
				nextOffset: offset + items.length < value.length ? offset + items.length : null,
			};
		}
		const text = typeof value === "string" ? value : JSON.stringify(value);
		const preview = truncateBytes(text.slice(offset), MAX_RESULT_BYTES - 512);
		return {
			handle,
			field,
			preview,
			fields: value && typeof value === "object" ? Object.keys(value) : undefined,
			nextOffset:
				offset + preview.length < text.length
					? offset + preview.length - (preview.endsWith("…") ? 1 : 0)
					: null,
		};
	}
}
