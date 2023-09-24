import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import {CrTimetable} from "thu-info-lib/dist/models/cr/cr";

export interface TimetableState {
	crTimetable: CrTimetable[];
}

const initialState: TimetableState = {
	crTimetable: [],
};

export const defaultTimetable = initialState;

export const timetableSlice = createSlice({
	name: "timetable",
	initialState,
	reducers: {
		setCrTimetable: (state, {payload}: PayloadAction<CrTimetable[]>) => {
			state.crTimetable = payload;
		},
	},
});

export const {setCrTimetable} = timetableSlice.actions;

export const timetableReducer = timetableSlice.reducer;
