import type {Schedule} from "@thu-info/lib/src/models/schedule/schedule";

export interface ImportRange {
	/** Local-date boundaries, stored as epoch milliseconds; end is exclusive. */
	start: number;
	end: number;
}

export interface ImportRecord {
	id: string;
	name: string;
	location: string;
	start: number;
	end: number;
}

export type ImportMode = "append" | "replace";
export type ImportStatus = "ready" | "duplicate" | "conflict";

export const isInImportRange = (start: number, range: ImportRange) =>
	start >= range.start && start < range.end;

export const importRecordKey = (record: Omit<ImportRecord, "id">) =>
	JSON.stringify([
		record.name.trim(),
		record.location.trim(),
		record.start,
		record.end,
	]);

export const scheduleRecords = (schedules: Schedule[]): ImportRecord[] =>
	schedules.flatMap((schedule) =>
		schedule.activeTime.base.map((slice, index) => ({
			id: `${schedule.hash}:${index}`,
			name: schedule.name,
			location: schedule.location,
			start: slice.beginTime.valueOf(),
			end: slice.endTime.valueOf(),
		})),
	);

export function classifyImportRecords(
	records: ImportRecord[],
	existing: ImportRecord[],
) {
	const seen = new Set(existing.map(importRecordKey));
	const accepted: ImportRecord[] = [];
	return records.map((record): ImportRecord & {status: ImportStatus} => {
		const key = importRecordKey(record);
		if (seen.has(key)) {
			return {...record, status: "duplicate"};
		}
		seen.add(key);
		const overlaps = (other: ImportRecord) =>
			record.start < other.end && record.end > other.start;
		const conflict = existing.some(overlaps) || accepted.some(overlaps);
		accepted.push(record);
		return {...record, status: conflict ? "conflict" : "ready"};
	});
}

export function mergeImportRanges(ranges: ImportRange[]): ImportRange[] {
	const result: ImportRange[] = [];
	for (const range of [...ranges].sort((a, b) => a.start - b.start)) {
		const last = result[result.length - 1];
		if (last && range.start <= last.end) {
			last.end = Math.max(last.end, range.end);
		} else {
			result.push({...range});
		}
	}
	return result;
}
