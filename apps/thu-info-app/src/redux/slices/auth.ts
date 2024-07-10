import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";

export interface AuthState {
	userId: string;
	password: string;
	fingerprint: string | undefined;
}

const initialState: AuthState = {
	userId: "",
	password: "",
	fingerprint: undefined,
};

export const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		login: (state, {payload}: PayloadAction<AuthState>) => {
			state.userId = payload.userId;
			state.password = payload.password;
			state.fingerprint = payload.fingerprint;
		},
		logout: (state) => {
			state.userId = "";
			state.password = "";
			state.fingerprint = undefined;
		},
	},
});

export const {login, logout} = authSlice.actions;

export const authReducer = authSlice.reducer;
