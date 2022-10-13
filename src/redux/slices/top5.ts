import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";

export interface Top5State {
	top5Functions: string[];
}
const initialState: Top5State = {
	top5Functions: [],
};

export const defaultTop5 = initialState;

export const top5Slice = createSlice({
	name: "top5",
	initialState,
	reducers: {
		top5Update: (state, {payload}: PayloadAction<string>) => {
			state.top5Functions = state.top5Functions.filter((x) => x !== payload);
			state.top5Functions.unshift(payload);
			state.top5Functions = state.top5Functions.slice(0, 5);
		},
		top5Set: (state, {payload}: PayloadAction<string[]>) => {
			state.top5Functions = payload.slice(0, 5);
		},
	},
});

export const {top5Update, top5Set} = top5Slice.actions;

export const top5Reducer = top5Slice.reducer;
