import ICAL from "ical.js";
import dayjs from "dayjs";
import {Buffer} from "buffer";
import {ImportRange, ImportRecord, isInImportRange} from "./scheduleImportData";

export const IMPORT_LIMITS = {
	bytes: 5 * 1024 * 1024,
	events: 1000,
	records: 5000,
	iterations: 50000,
};
export type ImportIssueReason =
	| "invalid"
	| "allDay"
	| "overnight"
	| "timezone"
	| "recurrence"
	| "cancelled"
	| "outside";
export interface ImportIssue {
	name: string;
	reason: ImportIssueReason;
}
export interface ImportResult {
	records: ImportRecord[];
	issues: ImportIssue[];
	floatingTime: boolean;
}
export type ImportErrorCode =
	"invalidFile" | "fileTooLarge" | "limit" | "range" | "aborted";

export class ScheduleImportError extends Error {
	constructor(public readonly code: ImportErrorCode) {
		super(code);
	}
}

/** Strict local dates; do not allow JS Date to roll an invalid date into next month. */
export function getImportRange(
	startDate: string,
	endDate: string,
): ImportRange {
	const parse = (value: string) => {
		if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
			throw new ScheduleImportError("range");
		}
		const date = dayjs(`${value}T00:00:00`);
		if (!date.isValid() || date.format("YYYY-MM-DD") !== value) {
			throw new ScheduleImportError("range");
		}
		return date;
	};
	const start = parse(startDate);
	const last = parse(endDate);
	if (last.isBefore(start) || last.diff(start, "day") >= 366) {
		throw new ScheduleImportError("range");
	}
	return {start: start.valueOf(), end: last.add(1, "day").valueOf()};
}

class EventIssue extends Error {
	constructor(public readonly reason: ImportIssueReason) {
		super(reason);
	}
}

const textValue = (component: ICAL.Component, key: string) => {
	const value = component.getFirstPropertyValue(key);
	return typeof value === "string" ? value : "";
};

function validateTimeProperties(component: ICAL.Component) {
	for (const name of ["dtstart", "dtend", "recurrence-id", "rdate", "exdate"]) {
		for (const property of component.getAllProperties(name)) {
			const tzid = property.getParameter("tzid");
			for (const raw of property.jCal.slice(3)) {
				if (typeof raw !== "string") {
					continue;
				}
				const match =
					/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z?$/.exec(raw);
				if (match) {
					const [, year, month, day, hour, minute, second] = match.map(Number);
					const date = new Date(0);
					date.setUTCFullYear(year, month - 1, day);
					if (
						date.getUTCMonth() !== month - 1 ||
						date.getUTCDate() !== day ||
						hour > 23 ||
						minute > 59 ||
						second > 59
					) {
						throw new EventIssue("invalid");
					}
				}
			}
			for (const value of property.getValues()) {
				if (!(value instanceof ICAL.Time)) {
					throw new EventIssue("recurrence");
				}
				if (value.isDate) {
					throw new EventIssue("allDay");
				}
				// ICAL silently treats an unknown TZID as floating. Never guess it.
				if (tzid && value.zone.tzid === ICAL.Timezone.localTimezone.tzid) {
					throw new EventIssue("timezone");
				}
			}
		}
	}
}

function validateRecurrence(component: ICAL.Component) {
	const rules = component.getAllProperties("rrule");
	if (rules.length > 1 || component.hasProperty("exrule")) {
		throw new EventIssue("recurrence");
	}
	const recurrenceId = component.getFirstProperty("recurrence-id");
	if (recurrenceId?.getParameter("range")) {
		throw new EventIssue("recurrence");
	}
	for (const property of rules) {
		const rule = property.getFirstValue();
		if (
			!(rule instanceof ICAL.Recur) ||
			!["DAILY", "WEEKLY"].includes(rule.freq)
		) {
			throw new EventIssue("recurrence");
		}
		if (
			!Number.isInteger(rule.interval) ||
			rule.interval < 1 ||
			(rule.count !== null &&
				(!Number.isInteger(rule.count) || rule.count < 1)) ||
			Object.keys(rule.parts).some((key) => key !== "BYDAY") ||
			(rule.parts.BYDAY ?? []).some(
				(day) => !/^(MO|TU|WE|TH|FR|SA|SU)$/.test(String(day)),
			)
		) {
			throw new EventIssue("recurrence");
		}
	}
}

/** All parsing is local. The result is a preview, never a Redux mutation. */
export async function parseScheduleICS(
	text: string,
	options: {startDate: string; endDate: string; signal?: AbortSignal},
): Promise<ImportResult> {
	const range = getImportRange(options.startDate, options.endDate);
	if (Buffer.byteLength(text, "utf8") > IMPORT_LIMITS.bytes) {
		throw new ScheduleImportError("fileTooLarge");
	}
	const checkCancelled = () => {
		if (options.signal?.aborted) {
			throw new ScheduleImportError("aborted");
		}
	};
	checkCancelled();
	let calendar: ICAL.Component;
	try {
		calendar = new ICAL.Component(
			ICAL.parse(text.replace(/^\uFEFF/, "").trim()),
		);
		if (calendar.name !== "vcalendar") {
			throw new Error();
		}
	} catch {
		throw new ScheduleImportError("invalidFile");
	}
	const components = calendar.getAllSubcomponents("vevent");
	if (components.length > IMPORT_LIMITS.events) {
		throw new ScheduleImportError("limit");
	}
	const result: ImportResult = {records: [], issues: [], floatingTime: false};
	const isOwnExport =
		textValue(calendar, "prodid") === "-//thu-info-app//thu-info-app//EN";
	const title = (component: ICAL.Component) => {
		const value = textValue(component, "summary").trim();
		return isOwnExport
			? value.replace(/^\[(自定义|Custom|考试|Exam)\]\s*/, "")
			: value;
	};
	let iterations = 0;
	const checkpoint = async () => {
		if (++iterations > IMPORT_LIMITS.iterations) {
			throw new ScheduleImportError("limit");
		}
		if (iterations % 100 === 0) {
			await new Promise<void>((resolve) => setTimeout(resolve, 0));
		}
		checkCancelled();
	};
	const issue = (component: ICAL.Component, reason: ImportIssueReason) => {
		result.issues.push({name: title(component), reason});
	};
	const add = (component: ICAL.Component, start: ICAL.Time, end: ICAL.Time) => {
		if (textValue(component, "status").toUpperCase() === "CANCELLED") {
			issue(component, "cancelled");
			return;
		}
		if (!title(component) || !start || !end) {
			throw new EventIssue("invalid");
		}
		if (start.isDate || end.isDate) {
			throw new EventIssue("allDay");
		}
		const begin = dayjs(start.toJSDate());
		const finish = dayjs(end.toJSDate());
		if (!begin.isValid() || !finish.isValid() || !finish.isAfter(begin)) {
			throw new EventIssue("invalid");
		}
		if (!isInImportRange(begin.valueOf(), range)) {
			return false;
		}
		if (!begin.isSame(finish, "day")) {
			throw new EventIssue("overnight");
		}
		result.floatingTime ||= start.zone === ICAL.Timezone.localTimezone;
		if (result.records.length >= IMPORT_LIMITS.records) {
			throw new ScheduleImportError("limit");
		}
		result.records.push({
			id: String(result.records.length),
			name: title(component),
			location: textValue(component, "location").trim(),
			start: begin.valueOf(),
			end: finish.valueOf(),
		});
		return true;
	};
	// Group only recurrence exceptions by UID. Old THUInfo exports may reuse UIDs
	// for independent events; those must NOT be collapsed into one event.
	const exceptions = new Map<string, ICAL.Component[]>();
	for (const component of components) {
		if (component.hasProperty("recurrence-id")) {
			const uid = textValue(component, "uid");
			exceptions.set(uid, [...(exceptions.get(uid) ?? []), component]);
		}
	}
	const handledExceptions = new Set<ICAL.Component>();
	for (const component of components) {
		await checkpoint();
		if (component.hasProperty("recurrence-id")) {
			continue;
		}
		const recordsBefore = result.records.length;
		const issuesBefore = result.issues.length;
		const related = exceptions.get(textValue(component, "uid")) ?? [];
		try {
			if (
				textValue(calendar, "method").toUpperCase() === "CANCEL" ||
				textValue(component, "status").toUpperCase() === "CANCELLED"
			) {
				issue(component, "cancelled");
				related.forEach((c) => handledExceptions.add(c));
				continue;
			}
			validateTimeProperties(component);
			validateRecurrence(component);
			if (
				!component.hasProperty("dtstart") ||
				(!component.hasProperty("dtend") && !component.hasProperty("duration"))
			) {
				throw new EventIssue("invalid");
			}
			const event = new ICAL.Event(component, {exceptions: []});
			const overridden = new Set<string>();
			for (const exception of related) {
				validateTimeProperties(exception);
				validateRecurrence(exception);
				if (exception.hasProperty("rrule") || exception.hasProperty("rdate")) {
					throw new EventIssue("recurrence");
				}
				const recurrenceId = exception.getFirstPropertyValue(
					"recurrence-id",
				) as ICAL.Time;
				const key = recurrenceId.toString();
				if (overridden.has(key)) {
					throw new EventIssue("recurrence");
				}
				overridden.add(key);
				handledExceptions.add(exception);
				if (textValue(exception, "status").toUpperCase() === "CANCELLED") {
					issue(exception, "cancelled");
					continue;
				}
				const override = new ICAL.Event(exception, {exceptions: []});
				// Process moved occurrences separately: they may enter the range
				// even when the original recurrence date is outside it.
				add(exception, override.startDate, override.endDate);
			}
			if (!event.isRecurring()) {
				add(component, event.startDate, event.endDate);
			} else {
				const iterator = event.iterator();
				let next: ICAL.Time | null;
				while ((next = iterator.next())) {
					await checkpoint();
					if (next.toJSDate().getTime() >= range.end) {
						break;
					}
					if (overridden.has(next.toString())) {
						continue;
					}
					const details = event.getOccurrenceDetails(next);
					add(component, details.startDate, details.endDate);
				}
			}
			if (
				result.records.length === recordsBefore &&
				result.issues.length === issuesBefore
			) {
				issue(component, "outside");
			}
		} catch (error) {
			if (error instanceof ScheduleImportError) {
				throw error;
			}
			// A malformed exception/series must not leave a partly imported series.
			result.records.splice(recordsBefore);
			result.issues.splice(issuesBefore);
			related.forEach((c) => handledExceptions.add(c));
			issue(component, error instanceof EventIssue ? error.reason : "invalid");
		}
	}
	for (const list of exceptions.values()) {
		for (const exception of list) {
			if (!handledExceptions.has(exception)) {
				issue(exception, "recurrence");
			}
		}
	}
	checkCancelled();
	return result;
}
