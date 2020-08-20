import {retrieve, stringify} from "./core";
import {
	LIBRARY_AREAS_URL,
	LIBRARY_DAYS_URL,
	LIBRARY_HOME_URL,
	LIBRARY_LIST_URL,
	LIBRARY_SEATS_URL,
} from "../constants/strings";
import {
	Library,
	LibraryDate,
	LibraryFloor,
	LibrarySeat,
	LibrarySection,
} from "../models/home/library";
import "../../src/utils/extensions";

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
			.sort((a: LibraryFloor, b: LibraryFloor) => Number(a.id) - Number(b.id)),
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
		return r.map((node: any) => ({
			day: node.day,
			startTime: transformDate(node.startTime),
			endTime: transformDate(node.endTime),
			segmentId: node.id,
		}));
	});

export const getLibrarySectionList = (
	{id, zhNameTrace, enNameTrace}: LibraryFloor,
	date: Date,
): Promise<LibrarySection[]> =>
	fetchJson(LIBRARY_AREAS_URL + id + "/date/" + date.format()).then((r) => {
		return r.childArea.map((node: any) => ({
			id: node.id,
			zhName: node.name,
			zhNameTrace: `${zhNameTrace} - ${node.name}`,
			enName: node.enname,
			enNameTrace: `${enNameTrace} - ${node.enname}`,
			valid: node.isValid === 1,
			total: node.TotalCount,
			available: node.TotalCount - node.UnavailableSpace,
		}));
	});

export const getLibrarySeatList = (
	{id, zhNameTrace, enNameTrace}: LibrarySection,
	{day, startTime, endTime, segmentId}: LibraryDate,
): Promise<LibrarySeat[]> =>
	fetchJson(
		LIBRARY_SEATS_URL +
			"?" +
			stringify({
				area: id,
				segment: segmentId,
				day,
				startTime,
				endTime,
			}),
	).then((r: any[]) => {
		console.log(
			LIBRARY_SEATS_URL +
				"?" +
				stringify({
					area: id,
					segment: segmentId,
					day,
					startTime,
					endTime,
				}),
		);
		return r.map((node: any) => ({
			id: node.id,
			zhName: node.name,
			zhNameTrace: zhNameTrace + " - " + node.name,
			enName: node.name,
			enNameTrace: enNameTrace + " - " + node.name,
			valid: node.status === 1,
		}));
	});
