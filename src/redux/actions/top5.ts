import {ActionType, createAction} from "typesafe-actions";

export const top5UpdateAction = createAction("TOP5_UPDATE")<string>();

const top5Action = {
	top5UpdateAction,
};
export type Top5Action = ActionType<typeof top5Action>;
