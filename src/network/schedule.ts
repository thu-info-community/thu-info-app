import {retrieve, retryWrapper} from "./core";
import {
	INFO_ROOT_URL,
	JXMH_REFERER,
	JXRL_MIDDLE,
	JXRL_BKS_PREFIX,
	JXRL_SUFFIX,
	SECONDARY_URL,
	JXRL_YJS_PREFIX,
} from "../constants/strings";
import {Schedule, parseJSON, parseScript} from "../models/schedule/schedule";
import {Calendar} from "../utils/calendar";
import {currState, mocked} from "../redux/store";

export const getPrimarySchedule = () => {
	const format = (c: Calendar) => c.format("YYYYMMDD");
	const groupSize = 3; // Make sure that `groupSize` is a divisor of `Calendar.weekCount`.
	return mocked()
		? Promise.resolve([])
		: retryWrapper(
				792,
				Promise.all(
					Array.from(new Array(Calendar.weekCount / groupSize), (_, id) =>
						retrieve(
							(currState().config.graduate
								? JXRL_YJS_PREFIX
								: JXRL_BKS_PREFIX) +
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
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  );
};

export const getSecondary = () =>
	mocked()
		? Promise.resolve([])
		: retryWrapper(
				792,
				retrieve(SECONDARY_URL, JXMH_REFERER, undefined, "GBK").then((str) => {
					const lowerBound = str.indexOf("function setInitValue");
					const upperBound = str.indexOf("}", lowerBound);
					return parseScript(
						str.substring(lowerBound, upperBound),
					) as Schedule[];
				}),
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  );

export const getSchedule = async () => {
	let scheduleList: Schedule[] = [];
	scheduleList = scheduleList.concat(await getPrimarySchedule());
	scheduleList = scheduleList.concat(await getSecondary());
	return scheduleList;
};

export const getSecondaryVerbose = () =>
	retryWrapper(
		792,
		retrieve(SECONDARY_URL, JXMH_REFERER, undefined, "GBK").then((str) => {
			const lowerBound = str.indexOf("function setInitValue");
			const upperBound = str.indexOf("}", lowerBound);
			return parseScript(str.substring(lowerBound, upperBound), true) as [
				string,
				string,
				boolean,
			][];
		}),
	);
