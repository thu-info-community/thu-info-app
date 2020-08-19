import {retrieve} from "./core";
import {LIBRARY_HOME_URL, LIBRARY_TREE_URL} from "../constants/strings";
import {LibraryNode} from "../models/home/library";

const fetchJson = (
	url: string,
	referer?: string,
	post?: object | string,
): Promise<any> => retrieve(url, referer, post).then(JSON.parse);

const refine = (node: any): LibraryNode => {
	return {
		id: node.id,
		zhName: node.name,
		zhNameTrace: node.nameMerge,
		enName: node.enname,
		enNameTrace: node.ennameMerge,
		valid: node.isValid === 1,
		children: node._child?.map(refine) ?? [],
	};
};

export const getLibraryTree = (): Promise<LibraryNode> =>
	fetchJson(LIBRARY_TREE_URL, LIBRARY_HOME_URL).then((r) => {
		return {
			id: -1,
			zhName: "",
			zhNameTrace: "",
			enName: "",
			enNameTrace: "",
			valid: true,
			children: r.data.list.map(refine),
		};
	});
