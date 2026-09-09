import {findNonSerializableValue} from "@reduxjs/toolkit";
import dayjs from "dayjs";
import {expect, test} from "@jest/globals";
import {
	getSerializableEntries,
	isSerializable,
} from "../src/redux/serializable";

test("accepts Dayjs schedule times but still rejects other class instances", () => {
	const scheduleState = {
		schedule: {
			baseSchedule: [
				{
					activeTime: {
						base: [{beginTime: dayjs("2026-09-14T09:50:00+08:00")}],
					},
				},
			],
		},
	};

	expect(
		findNonSerializableValue(
			scheduleState,
			"",
			isSerializable,
			getSerializableEntries,
		),
	).toBe(false);
	expect(
		findNonSerializableValue(
			{date: new Date("2026-09-14T09:50:00+08:00")},
			"",
			isSerializable,
			getSerializableEntries,
		),
	).toEqual(expect.objectContaining({keyPath: "date"}));
});
