import {retrieve} from "./core";
import {
	LIBRARY_FLOORS_URL,
	LIBRARY_HOME_URL,
	LIBRARY_LIST_URL,
} from "../constants/strings";
import {Library, LibraryFloor} from "../models/home/library";

const fetchJson = (
	url: string,
	referer?: string,
	post?: object | string,
): Promise<any> => retrieve(url, referer, post).then(JSON.parse);

export const getLibraryList = (): Promise<Library[]> =>
	fetchJson(LIBRARY_LIST_URL, LIBRARY_HOME_URL).then((r) =>
		r.data.list.map((node: any) => ({
			id: node.id,
			zhName: node.name,
			zhNameTrace: node.nameMerge,
			enName: node.enname,
			enNameTrace: node.ennameMerge,
			valid: node.isValid === 1,
		})),
	);

export const getLibraryFloorList = (
	libraryId: number,
): Promise<LibraryFloor[]> =>
	fetchJson(LIBRARY_FLOORS_URL + libraryId, LIBRARY_HOME_URL).then((r) =>
		r.data.list.childArea
			.map((node: any) => ({
				id: node.id,
				zhName: node.name,
				zhNameTrace: node.name,
				enName: node.enname,
				enNameTrace: node.enname,
				valid: node.isValid === 1,
			}))
			.sort((a: LibraryFloor, b: LibraryFloor) => Number(a.id) - Number(b.id)),
	);
