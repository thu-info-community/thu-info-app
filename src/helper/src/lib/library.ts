/* eslint-disable quotes */
import {retrieve, retryWrapper, stringify} from "./core";
import {
	CANCEL_BOOKING_URL,
	LIBRARY_AREAS_URL,
	LIBRARY_BOOK_RECORD_URL,
	LIBRARY_BOOK_URL_PREFIX,
	LIBRARY_BOOK_URL_SUFFIX,
	LIBRARY_DAYS_URL,
	LIBRARY_HOME_URL,
	LIBRARY_LIST_URL,
	LIBRARY_SEATS_URL,
} from "../constants/strings";
import {
	byId,
	LibBookRecord,
	Library,
	LibraryDate,
	LibraryFloor,
	LibrarySeat,
	LibrarySection,
	weightedValidityAndId,
} from "../models/home/library";
import "../utils/extensions";
import cheerio from "cheerio";
import {getCheerioText} from "../utils/cheerio";
import dayjs from "dayjs";
import AV from "leancloud-storage/core";
import {InfoHelper} from "../index";
type Cheerio = ReturnType<typeof cheerio>;
type Element = Cheerio[number];
type TagElement = Element & {type: "tag"};

const fetchJson = (
	url: string,
	referer?: string,
	post?: object | string,
): Promise<any> =>
	retrieve(url, referer, post).then((s) => JSON.parse(s).data.list);

export const getLibraryList = (helper: InfoHelper): Promise<Library[]> =>
	helper.mocked()
		? Promise.resolve([
				{
					enName: "Main Library North Section",
					enNameTrace: "Main Library North Section",
					id: 35,
					valid: true,
					zhName: "北馆(李文正馆)",
					zhNameTrace: "北馆(李文正馆)",
				},
				{
					enName: "Humanities and Social Sciences Library",
					enNameTrace: "Humanities and Social Sciences Library",
					id: 89,
					valid: true,
					zhName: "文科图书馆",
					zhNameTrace: "文科图书馆",
				},
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  ])
		: fetchJson(LIBRARY_LIST_URL, LIBRARY_HOME_URL).then(
				(r) =>
					r.map((node: any) => ({
						id: node.id,
						zhName: node.name,
						zhNameTrace: node.nameMerge,
						enName: node.enname,
						enNameTrace: node.ennameMerge,
						valid: node.isValid === 1,
					})),
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  );

export const getLibrarySectionList = (
	helper: InfoHelper,
	{id, zhNameTrace, enNameTrace}: LibraryFloor,
	dateChoice: 0 | 1,
): Promise<LibrarySection[]> =>
	fetchJson(
		LIBRARY_AREAS_URL +
			id +
			"/date/" +
			dayjs().add(dateChoice, "day").toDate().format(),
	).then((r) =>
		r.childArea
			.map((node: any) => ({
				id: node.id,
				zhName: node.name,
				zhNameTrace: `${zhNameTrace} - ${node.name}`,
				enName: node.enname,
				enNameTrace: `${enNameTrace} - ${node.enname}`,
				valid: node.isValid === 1,
				total: node.TotalCount,
				available: node.TotalCount - node.UnavailableSpace,
				posX: node.point_x2,
				posY: node.point_y2,
			}))
			.sort(byId),
	);

export const getLibraryFloorList = async (
	helper: InfoHelper,
	{id, zhName, enName}: Library,
	dateChoice: 0 | 1,
): Promise<LibraryFloor[]> => {
	if (helper.mocked()) {
		if (id === 89 && dateChoice === 0) {
			return [
				{
					// @ts-ignore
					available: 0,
					enName: "1 st Floor",
					enNameTrace: "Humanities and Social Sciences Library - 1 st Floor",
					id: 90,
					parentId: 89,
					total: 76,
					valid: true,
					zhName: "一层 ",
					zhNameTrace: "文科图书馆 - 一层 ",
				},
				{
					// @ts-ignore
					available: 1,
					enName: "2 nd Floor",
					enNameTrace: "Humanities and Social Sciences Library - 2 nd Floor",
					id: 91,
					parentId: 89,
					total: 138,
					valid: true,
					zhName: "二层",
					zhNameTrace: "文科图书馆 - 二层",
				},
				{
					// @ts-ignore
					available: 0,
					enName: "3 rd Floor",
					enNameTrace: "Humanities and Social Sciences Library - 3 rd Floor",
					id: 92,
					parentId: 89,
					total: 172,
					valid: true,
					zhName: "三层",
					zhNameTrace: "文科图书馆 - 三层",
				},
				{
					// @ts-ignore
					available: 0,
					enName: "4 th Floor",
					enNameTrace: "Humanities and Social Sciences Library - 4 th Floor",
					id: 93,
					parentId: 89,
					total: 88,
					valid: true,
					zhName: "四层",
					zhNameTrace: "文科图书馆 - 四层",
				},
			];
		} else if (id === 89 && dateChoice === 1) {
			return [
				{
					// @ts-ignore
					available: 8,
					enName: "1 st Floor",
					enNameTrace: "Humanities and Social Sciences Library - 1 st Floor",
					id: 90,
					parentId: 89,
					total: 76,
					valid: true,
					zhName: "一层 ",
					zhNameTrace: "文科图书馆 - 一层 ",
				},
				{
					// @ts-ignore
					available: 8,
					enName: "2 nd Floor",
					enNameTrace: "Humanities and Social Sciences Library - 2 nd Floor",
					id: 91,
					parentId: 89,
					total: 138,
					valid: true,
					zhName: "二层",
					zhNameTrace: "文科图书馆 - 二层",
				},
				{
					// @ts-ignore
					available: 0,
					enName: "3 rd Floor",
					enNameTrace: "Humanities and Social Sciences Library - 3 rd Floor",
					id: 92,
					parentId: 89,
					total: 172,
					valid: true,
					zhName: "三层",
					zhNameTrace: "文科图书馆 - 三层",
				},
				{
					// @ts-ignore
					available: 27,
					enName: "4 th Floor",
					enNameTrace: "Humanities and Social Sciences Library - 4 th Floor",
					id: 93,
					parentId: 89,
					total: 88,
					valid: true,
					zhName: "四层",
					zhNameTrace: "文科图书馆 - 四层",
				},
			];
		} else if (id === 35 && dateChoice === 0) {
			return [
				{
					// @ts-ignore
					available: 0,
					enName: "1 st Floor",
					enNameTrace: "Main Library North Section - 1 st Floor",
					id: 36,
					parentId: 35,
					total: 33,
					valid: true,
					zhName: "一层",
					zhNameTrace: "北馆(李文正馆) - 一层",
				},
				{
					// @ts-ignore
					available: 1,
					enName: "2 nd Floor",
					enNameTrace: "Main Library North Section - 2 nd Floor",
					id: 37,
					parentId: 35,
					total: 312,
					valid: true,
					zhName: "二层",
					zhNameTrace: "北馆(李文正馆) - 二层",
				},
				{
					// @ts-ignore
					available: 0,
					enName: "3 rd Floor",
					enNameTrace: "Main Library North Section - 3 rd Floor",
					id: 38,
					parentId: 35,
					total: 266,
					valid: true,
					zhName: "三层",
					zhNameTrace: "北馆(李文正馆) - 三层",
				},
				{
					// @ts-ignore
					available: 0,
					enName: "4 th Floor",
					enNameTrace: "Main Library North Section - 4 th Floor",
					id: 39,
					parentId: 35,
					total: 240,
					valid: true,
					zhName: "四层",
					zhNameTrace: "北馆(李文正馆) - 四层",
				},
				{
					// @ts-ignore
					available: 0,
					enName: "5 th Floor",
					enNameTrace: "Main Library North Section - 5 th Floor",
					id: 40,
					parentId: 35,
					total: 100,
					valid: true,
					zhName: "五层",
					zhNameTrace: "北馆(李文正馆) - 五层",
				},
				{
					// @ts-ignore
					available: 0,
					enName: "G Floor",
					enNameTrace: "Main Library North Section - G Floor",
					id: 103,
					parentId: 35,
					total: 0,
					valid: false,
					zhName: "G层(现场选位)",
					zhNameTrace: "北馆(李文正馆) - G层(现场选位)",
				},
			];
		} else if (id === 35 && dateChoice === 1) {
			return [
				{
					// @ts-ignore
					available: 17,
					enName: "1 st Floor",
					enNameTrace: "Main Library North Section - 1 st Floor",
					id: 36,
					parentId: 35,
					total: 33,
					valid: true,
					zhName: "一层",
					zhNameTrace: "北馆(李文正馆) - 一层",
				},
				{
					// @ts-ignore
					available: 148,
					enName: "2 nd Floor",
					enNameTrace: "Main Library North Section - 2 nd Floor",
					id: 37,
					parentId: 35,
					total: 312,
					valid: true,
					zhName: "二层",
					zhNameTrace: "北馆(李文正馆) - 二层",
				},
				{
					// @ts-ignore
					available: 129,
					enName: "3 rd Floor",
					enNameTrace: "Main Library North Section - 3 rd Floor",
					id: 38,
					parentId: 35,
					total: 266,
					valid: true,
					zhName: "三层",
					zhNameTrace: "北馆(李文正馆) - 三层",
				},
				{
					// @ts-ignore
					available: 128,
					enName: "4 th Floor",
					enNameTrace: "Main Library North Section - 4 th Floor",
					id: 39,
					parentId: 35,
					total: 240,
					valid: true,
					zhName: "四层",
					zhNameTrace: "北馆(李文正馆) - 四层",
				},
				{
					// @ts-ignore
					available: 6,
					enName: "5 th Floor",
					enNameTrace: "Main Library North Section - 5 th Floor",
					id: 40,
					parentId: 35,
					total: 16,
					valid: true,
					zhName: "五层",
					zhNameTrace: "北馆(李文正馆) - 五层",
				},
				{
					// @ts-ignore
					available: 0,
					enName: "G Floor",
					enNameTrace: "Main Library North Section - G Floor",
					id: 103,
					parentId: 35,
					total: 0,
					valid: false,
					zhName: "G层(现场选位)",
					zhNameTrace: "北馆(李文正馆) - G层(现场选位)",
				},
			];
		} else {
			return [];
		}
	}
	const r = await fetchJson(LIBRARY_AREAS_URL + id, LIBRARY_HOME_URL);
	return ((await Promise.all(
		r.childArea.map(async (node: any) => {
			const floor = {
				id: node.id,
				zhName: node.name,
				zhNameTrace: `${zhName} - ${node.name}`,
				enName: node.enname,
				enNameTrace: `${enName} - ${node.enname}`,
				valid: node.isValid === 1,
				parentId: id,
				available: 0,
				total: 0,
			};
			const [available, total] = (
				await Promise.all(
					await getLibrarySectionList(helper, floor, dateChoice),
				)
			).reduce(
				([px, py], curr) =>
					curr.valid ? [px + curr.available, py + curr.total] : [px, py],
				[0, 0],
			);
			floor.available = available;
			floor.total = total;
			return floor;
		}),
	)) as LibraryFloor[]).sort(byId);
};

const getLibraryDay = (
	sectionId: number,
	choice: 0 | 1,
): Promise<LibraryDate> =>
	fetchJson(LIBRARY_DAYS_URL + sectionId).then((r: any[]) => {
		const {day, startTime, endTime, id} = r.find(
			(it) => it.day === dayjs().add(choice, "day").format("YYYY-MM-DD"),
		);
		const transformDate = ({date}: {date: string}) => date.substring(11, 16);
		return {
			day,
			startTime: transformDate(startTime),
			endTime: transformDate(endTime),
			segmentId: id,
			today: choice === 0,
		};
	});

const pad = (ori: any, length: number) => {
	let result = String(ori);
	while (result.length < length) {
		result = "0" + result;
	}
	return result;
};

const currentTime = () => {
	const date = new Date();
	return `${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}`;
};

export const getLibrarySeatList = (
	{id, zhNameTrace, enNameTrace}: LibrarySection,
	dateChoice: 0 | 1,
): Promise<LibrarySeat[]> =>
	getLibraryDay(id, dateChoice).then(
		({day, startTime, endTime, segmentId, today}) =>
			Promise.all([
				fetchJson(
					LIBRARY_SEATS_URL +
						"?" +
						stringify({
							area: id,
							segment: segmentId,
							day,
							startTime: today ? currentTime() : startTime,
							endTime,
						}),
				),
				new AV.Query("Sockets").equalTo("sectionId", id).limit(1000).find(),
			]).then(([r, s]) =>
				r
					.map((node: any) => ({
						id: node.id,
						zhName: node.name,
						zhNameTrace: zhNameTrace + " - " + node.name,
						enName: node.name,
						enNameTrace: enNameTrace + " - " + node.name,
						valid: node.status === 1,
						type: node.area_type,
						hasSocket:
							s.find((it) => it.get("seatId") === node.id)?.get("available") ??
							false,
						lcObjId: s
							.find((it) => it.get("seatId") === node.id)
							?.get("objectId"),
					}))
					.sort(
						(a: LibrarySeat, b: LibrarySeat) =>
							weightedValidityAndId(a) - weightedValidityAndId(b),
					),
			),
	);

const getAccessToken = (helper: InfoHelper): Promise<string> =>
	retryWrapper(
		helper,
		5000,
		retrieve(LIBRARY_HOME_URL).then((response) => {
			if (helper.mocked()) {
				return "";
			}
			const leftmost = response.indexOf("access_token");
			const left = response.indexOf('"', leftmost) + 1;
			const right = response.indexOf('"', left);
			const token = response.substring(left, right);
			if (token.trim() === "") {
				throw new Error("Getting library token failed.");
			}
			return token;
		}),
	);

export const bookLibrarySeat = async (
	helper: InfoHelper,
	{id, type}: LibrarySeat,
	section: LibrarySection,
	dateChoice: 0 | 1,
): Promise<{status: number; msg: string}> =>
	helper.mocked()
		? {status: 0, msg: "Testing account cannot book a seat."}
		: JSON.parse(
				await getLibraryDay(section.id, dateChoice).then(async ({segmentId}) =>
					retrieve(
						LIBRARY_BOOK_URL_PREFIX + id + LIBRARY_BOOK_URL_SUFFIX,
						LIBRARY_HOME_URL,
						{
							access_token: await getAccessToken(helper),
							userid: helper.userId,
							segment: segmentId,
							type,
						},
					),
				),
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  );

export const getBookingRecords = async (
	helper: InfoHelper,
): Promise<LibBookRecord[]> => {
	if (helper.mocked()) {
		return [
			{
				delId: undefined,
				id: "202009111837",
				pos: "文科图书馆-四层-C区:F4C083",
				status: "已使用",
				time: "2020-09-11 12:15:52",
			},
			{
				delId: undefined,
				id: "202009070209",
				pos: "文科图书馆-二层-A区:F2A008",
				status: "用户取消",
				time: "2020-09-08 08:00:00",
			},
			{
				delId: undefined,
				id: "202009062358",
				pos: "文科图书馆-三层-A区:F3A018",
				status: "已使用",
				time: "2020-09-07 08:00:00",
			},
			{
				delId: undefined,
				id: "202009021093",
				pos: "文科图书馆-三层-B区:F3B018",
				status: "已关闭",
				time: "2020-09-02 10:57:25",
			},
			{
				delId: undefined,
				id: "202008310485",
				pos: "北馆(李文正馆)-四层-B阅览区:NF4B093",
				status: "已使用",
				time: "2020-08-31 08:31:03",
			},
		];
	}
	await getAccessToken(helper);
	const html = await retrieve(LIBRARY_BOOK_RECORD_URL, LIBRARY_HOME_URL);
	const result = cheerio("tbody", html)
		.children()
		.map((index, element) => {
			const delOnclick = (((element as TagElement).children[15] as TagElement)
				.children[3] as TagElement | undefined)?.attribs?.onclick;
			const delStrIndex = delOnclick ? delOnclick.indexOf("menuDel") + 9 : 0;
			const rightIndex = delOnclick?.indexOf("'", delStrIndex);
			return {
				id: getCheerioText(element, 3),
				pos: getCheerioText(element, 5),
				time: getCheerioText(element, 7),
				status: getCheerioText(element, 11),
				delId: delOnclick?.includes("menuDel")
					? delOnclick?.substring(delStrIndex, rightIndex)
					: undefined,
			};
		})
		.get();
	if (result.length === 0 && html.indexOf("tbody") === -1) {
		throw new Error("Getting lib book record failed!");
	}
	return result;
};

export const cancelBooking = async (
	helper: InfoHelper,
	id: string,
): Promise<void> => {
	if (helper.mocked()) {
		throw new Error("Testing account cannot cancel a seat.");
	}
	const token = await getAccessToken(helper);
	return retrieve(CANCEL_BOOKING_URL + id, LIBRARY_BOOK_RECORD_URL, {
		_method: "delete",
		id,
		userid: helper.userId,
		access_token: token,
	})
		.then(JSON.parse)
		.then((data: any) => {
			if (!data.status) {
				throw data.message;
			}
		});
};
