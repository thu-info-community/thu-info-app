import {store} from "../redux/store";
import {retrieve, stringify} from "./core";
import {HOLE_API_URL, HOLE_LOGIN_URL} from "../constants/strings";
import {FetchMode, HoleTitleCard} from "../models/home/hole";

const connect = (url: string, query?: object, post?: object): Promise<any> =>
	retrieve(
		url + "?" + stringify({...query, user_token: store.getState().hole.token}),
		undefined,
		post,
		"UTF-8",
		0,
		true,
	).then((s) => JSON.parse(s));

export const holeLogin = () =>
	connect(HOLE_LOGIN_URL).then((r: {error: any; result: []}) => {
		if (r.error) {
			throw new Error(r.error);
		} else if (r.result.length === 0) {
			throw new Error("Result check failed.");
		}
	});

export const getHoleList = async (
	mode: FetchMode,
	page: number,
	payload: string,
): Promise<HoleTitleCard[]> => {
	if (mode === FetchMode.SEARCH && payload.match(/#\d{1,7}/)) {
		return [];
	} else {
		return (
			await connect(
				HOLE_API_URL,
				mode === FetchMode.NORMAL
					? {action: "getlist", p: page}
					: mode === FetchMode.ATTENTION
					? {action: "getattention"}
					: {action: "search", pagesize: 50, page: page, keywords: payload},
			)
		).data;
	}
};
