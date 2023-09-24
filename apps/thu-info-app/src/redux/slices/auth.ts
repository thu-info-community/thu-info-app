import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";

export interface AuthState {
	userId: string;
	password: string;
}

const initialState: AuthState = {
	userId: "",
	password: "",
};

export const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		login: (state, {payload}: PayloadAction<AuthState>) => {
			state.userId = payload.userId;
			state.password = payload.password;
		},
		logout: (state) => {
			state.userId = "";
			state.password = "";
		},
	},
});

export const {login, logout} = authSlice.actions;

export const authReducer = authSlice.reducer;
