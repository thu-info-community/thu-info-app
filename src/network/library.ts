/* eslint-disable quotes */
import {connect, retrieve, stringify} from "./core";
import {
	ID_LOGIN_CHECK_URL,
	LIBRARY_AREAS_URL,
	LIBRARY_BOOK_URL_PREFIX,
	LIBRARY_BOOK_URL_SUFFIX,
	LIBRARY_DAYS_URL,
	LIBRARY_HOME_URL,
	LIBRARY_LIST_URL,
	LIBRARY_LOGIN_URL,
	LIBRARY_SEATS_URL,
} from "../constants/strings";
import {
	byId,
	Library,
	LibraryDate,
	LibraryFloor,
	LibrarySeat,
	LibrarySection,
} from "../models/home/library";
import "../../src/utils/extensions";
import {currState} from "../redux/store";
import cheerio from "cheerio";

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

export const getLibraryFloorList = ({
	id,
	zhName,
	enName,
}: Library): Promise<LibraryFloor[]> =>
	fetchJson(LIBRARY_AREAS_URL + id, LIBRARY_HOME_URL).then((r) =>
		r.childArea
			.map((node: any) => ({
				id: node.id,
				zhName: node.name,
				zhNameTrace: `${zhName} - ${node.name}`,
				enName: node.enname,
				enNameTrace: `${enName} - ${node.enname}`,
				valid: node.isValid === 1,
				parentId: id,
			}))
			.sort(byId),
	);

export const getLibraryDays = ({
	id,
}: LibrarySection): Promise<[LibraryDate, LibraryDate]> =>
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
		}));
	});

export const getLibrarySectionList = (
	{id, zhNameTrace, enNameTrace}: LibraryFloor,
	date: Date,
): Promise<LibrarySection[]> =>
	fetchJson(LIBRARY_AREAS_URL + id + "/date/" + date.format()).then((r) =>
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
	{day, startTime, endTime, segmentId, today}: LibraryDate,
): Promise<LibrarySeat[]> =>
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
	);

const getAccessToken = async () => {
	await connect(LIBRARY_LOGIN_URL, undefined);
	const redirect = cheerio(
		"div.wrapper>a",
		await retrieve(ID_LOGIN_CHECK_URL, LIBRARY_LOGIN_URL, {
			i_user: currState().auth.userId,
			i_pass: currState().auth.password,
			i_captcha: "",
		}),
	).attr().href;
	await connect(redirect);
	const response = await retrieve(LIBRARY_HOME_URL);
	const leftmost = response.indexOf("access_token");
	const left = response.indexOf('"', leftmost) + 1;
	const right = response.indexOf('"', left);
	return response.substring(left, right);
};

export const bookLibrarySeat = async (
	{id, type}: LibrarySeat,
	{segmentId}: LibraryDate,
): Promise<{status: number; msg: string}> =>
	JSON.parse(
		await retrieve(
			LIBRARY_BOOK_URL_PREFIX + id + LIBRARY_BOOK_URL_SUFFIX,
			LIBRARY_HOME_URL,
			{
				access_token: await getAccessToken(),
				userid: currState().auth.userId,
				segment: segmentId,
				type,
			},
		),
	);
