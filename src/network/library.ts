import {retrieve} from "./core";
import {LIBRARY_HOME_URL, LIBRARY_LIST_URL} from "../constants/strings";
import {Library} from "../models/home/library";

const fetchJson = (
	url: string,
	referer?: string,
	post?: object | string,
): Promise<any> => retrieve(url, referer, post).then(JSON.parse);

export const getLibraryList = (): Promise<Library[]> =>
	fetchJson(LIBRARY_LIST_URL, LIBRARY_HOME_URL).then((r) =>
		r.data.list.map((node: any) => {
			return {
				id: node.id,
				zhName: node.name,
				zhNameTrace: node.nameMerge,
				enName: node.enname,
				enNameTrace: node.ennameMerge,
				valid: node.isValid === 1,
			};
		}),
	);
