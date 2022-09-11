import {ActionType, createAction} from "typesafe-actions";

export const top5UpdateAction = createAction("TOP5_UPDATE")<string>();
export const top5SetAction = createAction("TOP5_SET")<string[]>();

const top5Action = {
	top5UpdateAction,
	top5SetAction,
};
export type Top5Action = ActionType<typeof top5Action>;
