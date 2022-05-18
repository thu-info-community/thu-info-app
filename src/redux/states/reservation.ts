import {LibBookRecord} from "thu-info-lib/dist/models/home/library";

export interface Reservation {
	activeLibBookRecords: LibBookRecord[];
}

export const defaultReservation: Reservation = {
	activeLibBookRecords: [],
};
