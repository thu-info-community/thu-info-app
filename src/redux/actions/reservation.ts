import {ActionType, createAction} from "typesafe-actions";
import {SET_ACTIVE_LIB_BOOK_RECORD} from "../constants";
import {LibBookRecord} from "thu-info-lib/dist/models/home/library";

export const setActiveLibBookRecordAction = createAction(
	SET_ACTIVE_LIB_BOOK_RECORD,
)<LibBookRecord[]>();

const reservationAction = {
	setActiveLibBookRecordAction,
};
export type ReservationAction = ActionType<typeof reservationAction>;
