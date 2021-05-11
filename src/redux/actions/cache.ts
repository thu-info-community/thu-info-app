import {ADD_NEWS_CACHE} from "../constants";
import {NewsCache} from "../states/cache";
import {ActionType, createAction} from "typesafe-actions";

export const addNewsCacheAction = createAction(ADD_NEWS_CACHE)<NewsCache>();

const cacheAction = {addNewsCacheAction};
export type CacheAction = ActionType<typeof cacheAction>;
