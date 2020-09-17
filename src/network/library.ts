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
} from "../models/home/library";
import "../../src/utils/extensions";
import {currState, mocked} from "../redux/store";
import cheerio from "cheerio";
import {getCheerioText} from "../utils/cheerio";
import dayjs from "dayjs";

const fetchJson = (
	url: string,
	referer?: string,
	post?: object | string,
): Promise<any> =>
	retrieve(url, referer, post).then((s) => JSON.parse(s).data.list);

export const getLibraryList = (): Promise<Library[]> =>
	fetchJson(LIBRARY_LIST_URL, LIBRARY_HOME_URL).then((r) =>
		r.map((node: any) => ({
			id: node.id,
			zhName: node.name,
			zhNameTrace: node.nameMerge,
			enName: node.enname,
			enNameTrace: node.ennameMerge,
			valid: node.isValid === 1,
		})),
	);

export const getLibrarySectionList = (
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
			}))
			.sort(byId),
	);

export const getLibraryFloorList = async (
	{id, zhName, enName}: Library,
	dateChoice: 0 | 1,
): Promise<LibraryFloor[]> => {
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
				await Promise.all(await getLibrarySectionList(floor, dateChoice))
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

export const getLibraryDay = (
	id: number,
	choice: 0 | 1,
): Promise<LibraryDate> =>
	fetchJson(LIBRARY_DAYS_URL + id).then((r) => {
		if (r.length !== 2) {
			throw new Error("Expected 2 available days, got " + r.length);
		}
		const transformDate = (s: {date: string}) => {
			return s.date.substring(11, 16);
		};
		return r.map((node: any, index: number) => ({
			day: node.day,
			startTime: transformDate(node.startTime),
			endTime: transformDate(node.endTime),
			segmentId: node.id,
			today: index === 0,
		}))[choice];
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
			).then((r) =>
				r
					.map((node: any) => ({
						id: node.id,
						zhName: node.name,
						zhNameTrace: zhNameTrace + " - " + node.name,
						enName: node.name,
						enNameTrace: enNameTrace + " - " + node.name,
						valid: node.status === 1,
						type: node.area_type,
					}))
					.sort(byId),
			),
	);

const getAccessToken = (): Promise<string> =>
	retryWrapper(
		5000,
		retrieve(LIBRARY_HOME_URL).then((response) => {
			if (mocked()) {
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
	{id, type}: LibrarySeat,
	section: LibrarySection,
	dateChoice: 0 | 1,
): Promise<{status: number; msg: string}> =>
	mocked()
		? {status: 0, msg: "Testing account cannot book a seat."}
		: JSON.parse(
				await getLibraryDay(section.id, dateChoice).then(async ({segmentId}) =>
					retrieve(
						LIBRARY_BOOK_URL_PREFIX + id + LIBRARY_BOOK_URL_SUFFIX,
						LIBRARY_HOME_URL,
						{
							access_token: await getAccessToken(),
							userid: currState().auth.userId,
							segment: segmentId,
							type,
						},
					),
				),
				// eslint-disable-next-line no-mixed-spaces-and-tabs
		  );

export const getBookingRecords = async (): Promise<LibBookRecord[]> => {
	if (mocked()) {
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
	await getAccessToken();
	const html = await retrieve(LIBRARY_BOOK_RECORD_URL, LIBRARY_HOME_URL);
	const result = cheerio("tbody", html)
		.children()
		.map((index, element) => {
			const delOnclick = element.children[15].children[3]?.attribs?.onclick;
			const delStrIndex = delOnclick?.indexOf("menuDel") + 9;
			const rightIndex = delOnclick?.indexOf("'", delStrIndex);
			return {
				id: getCheerioText(element, 3),
				pos: getCheerioText(element, 5),
				time: getCheerioText(element, 7),
				status: getCheerioText(element, 11),
				delId: delOnclick?.substring(delStrIndex, rightIndex),
			};
		})
		.get();
	if (result.length === 0 && html.indexOf("tbody") === -1) {
		throw new Error("Getting lib book record failed!");
	}
	return result;
};

export const cancelBooking = async (id: string): Promise<void> => {
	if (mocked()) {
		throw new Error("Testing account cannot cancel a seat.");
	}
	const token = await getAccessToken();
	return retrieve(CANCEL_BOOKING_URL + id, LIBRARY_BOOK_RECORD_URL, {
		_method: "delete",
		id,
		userid: currState().auth.userId,
		access_token: token,
	})
		.then(JSON.parse)
		.then((data: any) => {
			if (!data.status) {
				throw data.message;
			}
		});
};
