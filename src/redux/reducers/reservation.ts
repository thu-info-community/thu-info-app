import {defaultReservation, Reservation} from "../states/reservation";
import {ReservationAction} from "../actions/reservation";
import {
	SET_ACTIVE_LIB_BOOK_RECORD,
	SET_ACTIVE_SPORTS_RESERVATION_RECORD,
} from "../constants";

export const reservation = (
	state: Reservation = defaultReservation,
	action: ReservationAction,
): Reservation => {
	switch (action.type) {
		case SET_ACTIVE_LIB_BOOK_RECORD:
			return {
				...state,
				activeLibBookRecords: action.payload.filter(
					({delId}) => delId !== undefined,
				),
			};
		case SET_ACTIVE_SPORTS_RESERVATION_RECORD:
			return {
				...state,
				activeSportsReservationRecords: [...action.payload],
			};
		default:
			return state;
	}
};
