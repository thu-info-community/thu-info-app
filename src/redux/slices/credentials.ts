import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";

export interface CredentialsState {
	dormPassword: string;
	appSecret: string | undefined;
}

const initialState: CredentialsState = {
	dormPassword: "",
	appSecret: undefined,
};

export const credentialsSlice = createSlice({
	name: "credentials",
	initialState,
	reducers: {
		setDormPassword: (state, {payload}: PayloadAction<string>) => {
			state.dormPassword = payload;
		},
		setAppSecret: (state, {payload}: PayloadAction<string | undefined>) => {
			state.appSecret = payload;
		},
	},
});

export const {setDormPassword, setAppSecret} = credentialsSlice.actions;

export const credentialsReducer = credentialsSlice.reducer;
