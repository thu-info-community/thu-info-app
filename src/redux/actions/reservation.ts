import {ActionType, createAction} from "typesafe-actions";
import {
	SET_ACTIVE_LIB_BOOK_RECORD,
	SET_ACTIVE_SPORTS_RESERVATION_RECORD,
} from "../constants";
import {LibBookRecord} from "thu-info-lib/dist/models/home/library";
import {SportsReservationRecord} from "thu-info-lib/dist/models/home/sports";

export const setActiveLibBookRecordAction = createAction(
	SET_ACTIVE_LIB_BOOK_RECORD,
)<LibBookRecord[]>();

export const setActiveSportsReservationRecordAction = createAction(
	SET_ACTIVE_SPORTS_RESERVATION_RECORD,
)<SportsReservationRecord[]>();

const reservationAction = {
	setActiveLibBookRecordAction,
	setActiveSportsReservationRecordAction,
};
export type ReservationAction = ActionType<typeof reservationAction>;
