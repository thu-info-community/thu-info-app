import {retrieve, retryWrapper} from "./core";
import {JXRL_MIDDLE, JXRL_PREFIX, JXRL_SUFFIX} from "../constants/strings";
import {parseJSON} from "../models/schedule/schedule";
import {Calendar} from "../utils/calendar";

export const getSchedule = () => {
	const format = (c: Calendar) => c.date.format("YYYYMMDD");
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
				),
			),
		)
			.then((results) =>
				results
					.map((s) => s.substring(s.indexOf("[") + 1, s.lastIndexOf("]")))
					.filter((s) => s.trim().length > 0)
					.join(","),
			)
			.then((str) => JSON.parse(`[${str}]`))
			.then(parseJSON),
	);
};
