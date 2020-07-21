import {retrieve, retryWrapper} from "./core";
import {JXRL_MIDDLE, JXRL_PREFIX, JXRL_SUFFIX} from "../constants/strings";
import {parseJSON} from "../models/schedule/schedule";

export const getSchedule = () =>
	retryWrapper(
		792,
		Promise.all([
			retrieve(`${JXRL_PREFIX}20200815${JXRL_MIDDLE}20200824${JXRL_SUFFIX}`),
			retrieve(`${JXRL_PREFIX}20200825${JXRL_MIDDLE}20200904${JXRL_SUFFIX}`),
			retrieve(`${JXRL_PREFIX}20200905${JXRL_MIDDLE}20200914${JXRL_SUFFIX}`),
		])
			.then((results) =>
				results
					.map((s) => s.substring(s.indexOf("[") + 1, s.lastIndexOf("]")))
					.join(","),
			)
			.then((str) => JSON.parse(`[${str}]`))
			.then(parseJSON),
	);
