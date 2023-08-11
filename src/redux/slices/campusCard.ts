import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";

export interface CampusCardState {
	balance: number;
	updatedAt: number;
	paymentMethod: string;
	todayRechargeAmount: number;
	lastRechargeDate: string;
}

const initialState: CampusCardState = {
	balance: 0,
	updatedAt: 0,
	paymentMethod: "bank",
	todayRechargeAmount: 0,
	lastRechargeDate: "",
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
		updateRechargeAmount: (
			state,
			{payload}: PayloadAction<{amount: number; date: string}>,
		) => {
			if (state.lastRechargeDate === payload.date) {
				state.todayRechargeAmount += payload.amount;
			} else {
				state.todayRechargeAmount = payload.amount;
				state.lastRechargeDate = payload.date;
			}
		},
	},
});

export const {setBalance, setPaymentMethod, updateRechargeAmount} =
	campusCardSlice.actions;

export const campusCardReducer = campusCardSlice.reducer;
