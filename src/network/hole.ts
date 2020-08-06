import {store} from "../redux/store";
import {retrieve, stringify} from "./core";
import {HOLE_LOGIN_URL} from "../constants/strings";

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
