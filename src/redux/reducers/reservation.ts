import {defaultReservation, Reservation} from "../states/reservation";
import {ReservationAction} from "../actions/reservation";
import {SET_ACTIVE_LIB_BOOK_RECORD} from "../constants";

export const reservation = (
	state: Reservation = defaultReservation,
	action: ReservationAction,
): Reservation => {
	switch (action.type) {
		case SET_ACTIVE_LIB_BOOK_RECORD:
			console.log(action);
			return {
				activeLibBookRecords: action.payload.filter(
					({delId}) => delId !== undefined,
				),
			};
		default:
			return state;
	}
};
