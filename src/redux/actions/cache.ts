import {ADD_NEWS_CACHE} from "../constants";
import {NewsCache} from "../states/cache";

export type CacheAction = {type: typeof ADD_NEWS_CACHE; payload: NewsCache};
