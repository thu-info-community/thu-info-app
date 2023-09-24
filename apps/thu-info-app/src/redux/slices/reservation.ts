import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import {LibBookRecord} from "thu-info-lib/dist/models/home/library";
import {SportsReservationRecord} from "thu-info-lib/dist/models/home/sports";

export interface ReservationState {
	activeLibBookRecords: LibBookRecord[];
	activeSportsReservationRecords: SportsReservationRecord[];
}

const initialState: ReservationState = {
	activeLibBookRecords: [],
	activeSportsReservationRecords: [],
};

export const defaultReservation = initialState;

export const reservationSlice = createSlice({
	name: "reservation",
	initialState,
	reducers: {
		setActiveLibBookRecord: (
			state,
			{payload}: PayloadAction<LibBookRecord[]>,
		) => {
			state.activeLibBookRecords = payload.filter(
				({status}) =>
					status === "预约成功" ||
					status === "使用中" ||
					status === "预约开始提醒",
			);
		},
		setActiveSportsReservationRecord: (
			state,
			{payload}: PayloadAction<SportsReservationRecord[]>,
		) => {
			state.activeSportsReservationRecords = payload;
		},
	},
});

export const {setActiveLibBookRecord, setActiveSportsReservationRecord} =
	reservationSlice.actions;

export const reservationReducer = reservationSlice.reducer;
