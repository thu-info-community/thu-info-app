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
					({status}) =>
						status === "预约成功" ||
						status === "使用中" ||
						status === "预约开始提醒",
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
