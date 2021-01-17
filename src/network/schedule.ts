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
import {
	Schedule,
	mergeTimeBlocks,
	parseJSON,
	parseScript,
	ScheduleType,
} from "../models/schedule/schedule";
import {Calendar} from "../utils/calendar";
import {currState, mocked} from "../redux/store";

export const getPrimarySchedule = () => {
	const format = (c: Calendar) => c.format("YYYYMMDD");
	const groupSize = 3; // Make sure that `groupSize` is a divisor of `Calendar.weekCount`.
	return mocked()
		? Promise.resolve([
				{
					name: "回笼觉设计与梦境工程",
					location: "2.0*0.9的宿舍床",
					activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
						(val) => ({
							week: val,
							dayOfWeek: 1,
							begin: 1,
							end: 2,
						}),
					),
					delOrHideTime: [],
					type: ScheduleType.PRIMARY,
				},
				{
					name: "摸鱼学导论",
					location: "实验室和社工组织",
					activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
						(val) => ({
							week: val,
							dayOfWeek: 1,
							begin: 6,
							end: 7,
						}),
					),
					delOrHideTime: [],
					type: ScheduleType.PRIMARY,
				},
				{
					name: "临时进出校基本原理",
					location: "学生部、研工部",
					activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
						(val) => ({
							week: val,
							dayOfWeek: 2,
							begin: 3,
							end: 5,
						}),
					),
					delOrHideTime: [],
					type: ScheduleType.PRIMARY,
				},
				{
					name: "学婊艺术欣赏",
					location: "院系年级微信群",
					activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
						(val) => ({
							week: val,
							dayOfWeek: 2,
							begin: 8,
							end: 9,
						}),
					),
					delOrHideTime: [],
					type: ScheduleType.PRIMARY,
				},
				{
					name: "社畜学的想象力：拖延、甩锅与膜人",
					location: "桃李一层",
					activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
						(val) => ({
							week: val,
							dayOfWeek: 2,
							begin: 12,
							end: 13,
						}),
					),
					delOrHideTime: [],
					type: ScheduleType.PRIMARY,
				},
				{
					name: "初级校园新闻采写",
					location: "知乎",
					activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
						(val) => ({
							week: val,
							dayOfWeek: 3,
							begin: 6,
							end: 7,
						}),
					),
					delOrHideTime: [],
					type: ScheduleType.PRIMARY,
				},
				{
					name: "退学案例分析研讨课",
					location: "教务处",
					activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
						(val) => ({
							week: val,
							dayOfWeek: 4,
							begin: 6,
							end: 7,
						}),
					),
					delOrHideTime: [],
					type: ScheduleType.PRIMARY,
				},
				{
					name: "打包、取件与排队论",
					location: "紫荆14号楼北快递点",
					activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
						(val) => ({
							week: val,
							dayOfWeek: 4,
							begin: 10,
							end: 11,
						}),
					),
					delOrHideTime: [],
					type: ScheduleType.PRIMARY,
				},
				{
					name: "淘宝优惠数值计算",
					location: "智能手机",
					activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
						(val) => ({
							week: val,
							dayOfWeek: 4,
							begin: 12,
							end: 13,
						}),
					),
					delOrHideTime: [],
					type: ScheduleType.PRIMARY,
				},
				{
					name: "游戏氪金理论与实践",
					location: "PC/主机/智能设备",
					activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
						(val) => ({
							week: val,
							dayOfWeek: 5,
							begin: 3,
							end: 5,
						}),
					),
					delOrHideTime: [],
					type: ScheduleType.PRIMARY,
				},
				{
					name: "树洞文学中的清华形象",
					location: "THUHole",
					activeTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(
						(val) => ({
							week: val,
							dayOfWeek: 5,
							begin: 8,
							end: 9,
						}),
					),
					delOrHideTime: [],
					type: ScheduleType.PRIMARY,
				},
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  ])
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
							undefined,
							"GBK",
						),
					),
				)
					.then((results) => {
						console.log(results);
						results
							.map((s) => {
								if (s[0] !== "m") {
									throw 0;
								}
								return s.substring(s.indexOf("[") + 1, s.lastIndexOf("]"));
							})
							.filter((s) => s.trim().length > 0)
							.join(",");
					})
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
	scheduleList.forEach(mergeTimeBlocks);
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
