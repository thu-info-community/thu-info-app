import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";

export interface CampusCardState {
	balance: number;
	updatedAt: number;
	paymentMethod: string;
}

const initialState: CampusCardState = {
	balance: 0,
	updatedAt: 0,
	paymentMethod: "bank",
};

export const defaultCampusCard = initialState;

export const campusCardSlice = createSlice({
	name: "campusCard",
	initialState,
	reducers: {
		setBalance: (state, {payload}: PayloadAction<number>) => {
			state.balance = payload;
			state.updatedAt = Date.now();
		},
		setPaymentMethod: (state, {payload}: PayloadAction<string>) => {
			state.paymentMethod = payload;
		},
	},
});

export const {setBalance, setPaymentMethod} = campusCardSlice.actions;

export const campusCardReducer = campusCardSlice.reducer;
