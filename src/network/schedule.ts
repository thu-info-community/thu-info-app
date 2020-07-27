import {connect, retrieve, retryWrapper} from "./core";
import {
	COURSE_SELECT_ENTRY,
	INFO_ROOT_URL,
	JXRL_MIDDLE,
	JXRL_PREFIX,
	JXRL_SUFFIX,
	SECONDARY_PREFIX,
	SECONDARY_SUFFIX,
} from "../constants/strings";
import {parseJSON, parseScript} from "../models/schedule/schedule";
import {Calendar} from "../utils/calendar";

export const getSchedule = () => {
	const format = (c: Calendar) => c.format("YYYYMMDD");
	const groupSize = 3; // Make sure that `groupSize` is a divisor of `Calendar.weekCount`.
	return retryWrapper(
		792,
		Promise.all(
			Array.from(new Array(Calendar.weekCount / groupSize), (_, id) =>
				retrieve(
					JXRL_PREFIX +
						format(new Calendar(id * groupSize + 1, 1)) +
						JXRL_MIDDLE +
						format(new Calendar((id + 1) * groupSize, 7)) +
						JXRL_SUFFIX,
					INFO_ROOT_URL,
				),
			),
		)
			.then((results) =>
				results
					.map((s) => {
						if (s[0] !== "m") {
							throw 0;
						}
						return s.substring(s.indexOf("[") + 1, s.lastIndexOf("]"));
					})
					.filter((s) => s.trim().length > 0)
					.join(","),
			)
			.then((str) => JSON.parse(`[${str}]`))
			.then(parseJSON),
	);
};

export const getSecondary = () =>
	connect(COURSE_SELECT_ENTRY, INFO_ROOT_URL)
		.then(() =>
			retrieve(
				SECONDARY_PREFIX + Calendar.semesterId + SECONDARY_SUFFIX,
				COURSE_SELECT_ENTRY,
				undefined,
				"GBK",
			),
		)
		.then((str) => {
			const lowerBound = str.indexOf("function setInitValue");
			const upperBound = str.indexOf("}", lowerBound);
			return parseScript(str.substring(lowerBound, upperBound));
		});
