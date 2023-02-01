import {getStr} from "./i18n";

export const explainWeekList = (weekList: number[]): string => {
	const listDistinct = Array.from(new Set(weekList));
	const listSorted = listDistinct
		.filter((w) => Number.isInteger(w) && w > 0)
		.sort((a, b) => a - b);
	if (listSorted.length === 0) {
		return getStr("noWeek");
	} else if (listSorted.length === 1) {
		return getStr("weekNumPrefix") + listSorted[0] + getStr("weekNumSuffix");
	} else {
		const diff = listSorted[1] - listSorted[0];
		if (diff <= 2) {
			let consecutive = true;
			for (let i = 2; i < listSorted.length; i++) {
				const newDiff = listSorted[i] - listSorted[i - 1];
				if (newDiff !== diff) {
					consecutive = false;
					break;
				}
			}
			if (consecutive) {
				const rangeStr =
					getStr("weekNumPrefix") +
					listSorted[0] +
					"-" +
					listSorted[listSorted.length - 1] +
					getStr("weekNumSuffix");
				if (diff === 1) {
					return rangeStr;
				} else {
					return (
						rangeStr +
						getStr("lp") +
						getStr(listSorted[0] % 2 === 0 ? "evenWeeks" : "oddWeeks") +
						getStr("rp")
					);
				}
			}
		}

		const splitPoints = listSorted
			.filter((v, i, a) => v + 1 !== a[i + 1])
			.map((v) => listSorted.indexOf(v));
		const segments = splitPoints.map((p, i, a) => [
			listSorted[i === 0 ? 0 : a[i - 1] + 1],
			listSorted[p],
		]);
		return (
			getStr("weekNumPrefix") +
			segments
				.map(([beg, end]) => (beg === end ? `${beg}` : `${beg}-${end}`))
				.join(",") +
			getStr("weekNumSuffix")
		);
	}
};

export const explainPeriod = (
	dayOfWeek: number,
	periodBegin: number,
	periodEnd: number,
) => {
	return (
		getStr("dayOfWeek")[dayOfWeek] +
		" " +
		getStr("periodNumPrefix") +
		`${periodBegin}-${periodEnd}` +
		getStr("periodNumSuffix")
	);
};

export const explainWeekAndDay = (week: number, dayOfWeek: number) => {
	return (
		getStr("classroomHeaderPrefix") +
		week +
		getStr("classroomHeaderMiddle") +
		getStr("dayOfWeek")[dayOfWeek]
	);
};
