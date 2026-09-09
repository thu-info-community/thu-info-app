import {isPlain} from "@reduxjs/toolkit";
import dayjs from "dayjs";

// Schedule times are kept as Dayjs instances at runtime because the schedule
// UI and reducers use Dayjs methods. They are converted to timestamps by
// scheduleTransform before persistence, so treat them as an accepted atomic
// value in RTK's serializability check.
export const isSerializable = (value: unknown) =>
	dayjs.isDayjs(value) || isPlain(value);

export const getSerializableEntries = (value: unknown): [string, unknown][] =>
	dayjs.isDayjs(value)
		? []
		: Object.entries(value as Record<string, unknown>);
