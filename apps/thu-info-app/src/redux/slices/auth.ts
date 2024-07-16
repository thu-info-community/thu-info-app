import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import {v4 as uuidv4} from "uuid";

export interface AuthState {
	userId: string;
	password: string;
	fingerprint: string;
}

const initialState: AuthState = {
	userId: "",
	password: "",
	fingerprint: uuidv4().replace(/-/g, ""),
};

export const defaultAuth = initialState;

export const authSlice = createSlice({
	name: "auth",
	initialState,
	reducers: {
		login: (
			state,
			{
				payload,
			}: PayloadAction<{
				userId: string;
				password: string;
			}>,
		) => {
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
