import {LibBookRecord} from "thu-info-lib/dist/models/home/library";
import {SportsReservationRecord} from "thu-info-lib/dist/models/home/sports";

export interface Reservation {
	activeLibBookRecords: LibBookRecord[];
	activeSportsReservationRecords: SportsReservationRecord[];
}

export const defaultReservation: Reservation = {
	activeLibBookRecords: [],
	activeSportsReservationRecords: [],
};
