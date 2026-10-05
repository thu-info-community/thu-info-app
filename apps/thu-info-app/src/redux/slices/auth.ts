import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import {v4 as uuidv4} from "uuid";
import type {PasskeyCredential} from "@thu-info/lib";

export interface AuthState {
	userId: string;
	password: string;
	fingerprint: string;
	authMethod: "password" | "passkey";
	passkeys: Record<string, PasskeyCredential>;
	silentPasskeyLogin: Record<string, boolean>;
	pendingPasskey?: PasskeyCredential;
	retiredPasskeys?: PasskeyCredential[];
}

const initialState: AuthState = {
	userId: "",
	password: "",
	fingerprint: uuidv4().replace(/-/g, ""),
	authMethod: "password",
	passkeys: {},
	silentPasskeyLogin: {},
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
			state.authMethod = state.passkeys[payload.userId] ? "passkey" : "password";
			state.password = state.authMethod === "passkey" ? "" : payload.password;
		},
		setPendingPasskey: (state, {payload}: PayloadAction<PasskeyCredential | undefined>) => {
			state.pendingPasskey = payload;
		},
		setSilentPasskeyLogin: (state, {payload}: PayloadAction<{userId: string; enabled: boolean}>) => {
			// Enrolled credentials change mode only through a successful replacement.
			if (!state.passkeys[payload.userId]) {
				state.silentPasskeyLogin[payload.userId] = payload.enabled;
			}
		},
		loginWithPasskey: (state, {payload}: PayloadAction<PasskeyCredential>) => {
			const old = state.passkeys[payload.userId];
			if (old && old.credentialId !== payload.credentialId) {
				state.retiredPasskeys = [...(state.retiredPasskeys ?? []), old];
			}
			state.passkeys[payload.userId] = payload;
			state.silentPasskeyLogin[payload.userId] = payload.authenticationMode === "silent";
			state.userId = payload.userId;
			state.password = "";
			state.authMethod = "passkey";
			state.pendingPasskey = undefined;
		},
		forgetRetiredPasskey: (state, {payload}: PayloadAction<string>) => {
			state.retiredPasskeys = state.retiredPasskeys?.filter((credential) => credential.credentialId !== payload);
		},
		forgetPasskey: (state, {payload}: PayloadAction<string>) => {
			delete state.passkeys[payload];
			delete state.silentPasskeyLogin[payload];
			if (state.pendingPasskey?.userId === payload) state.pendingPasskey = undefined;
			if (state.userId === payload) {
				state.userId = "";
				state.password = "";
				state.authMethod = "password";
			}
		},
		logout: (state) => {
			state.userId = "";
			state.password = "";
			state.authMethod = "password";
		},
	},
});

export const {login, logout, loginWithPasskey, setPendingPasskey, setSilentPasskeyLogin, forgetPasskey, forgetRetiredPasskey} = authSlice.actions;

export const authReducer = authSlice.reducer;
