import {Cache} from "../states/cache";
import {defaultCache} from "../defaults";
import {CacheAction} from "../actions/cache";
import {ADD_NEWS_CACHE} from "../constants";

export const cache = (
	state: Cache = defaultCache,
	action: CacheAction,
): Cache => {
	switch (action.type) {
		case ADD_NEWS_CACHE:
			return state.news.find((it) => it.url === action.payload.url)
				? state
				: {...state, news: state.news.concat(action.payload)};
		default:
			return state;
	}
};
