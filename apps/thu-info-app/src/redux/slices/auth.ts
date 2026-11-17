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
	passkeyUpgradePending: boolean;
	/** Account -> credential ID that must be replaced; cleared only after durable activation. */
	passkeyRenewalRequired: Record<string, string>;
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
	passkeyUpgradePending: false,
	passkeyRenewalRequired: {},
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
			// Explicit password recovery must not immediately select the failing Passkey again.
			state.authMethod = "password";
			state.password = payload.password;
			state.passkeyUpgradePending = false;
		},
		dismissPasskeyUpgrade: (state) => {
			state.passkeyUpgradePending = false;
		},
		requirePasskeyRenewal: (state, {payload}: PayloadAction<string>) => {
			const credential = state.passkeys[payload];
			if (!credential) return;
			state.passkeyRenewalRequired[payload] ??= credential.credentialId;
			if (state.userId !== payload) {
				state.userId = payload;
				state.password = "";
				state.authMethod = "password";
			}
		},
		completePasskeyRenewal: (state, {payload}: PayloadAction<string>) => {
			delete state.passkeyRenewalRequired[payload];
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
			state.passkeyUpgradePending = false;
		},
		forgetRetiredPasskey: (state, {payload}: PayloadAction<string>) => {
			state.retiredPasskeys = state.retiredPasskeys?.filter((credential) => credential.credentialId !== payload);
		},
		forgetPasskey: (state, {payload}: PayloadAction<string>) => {
			delete state.passkeys[payload];
			delete state.silentPasskeyLogin[payload];
			delete state.passkeyRenewalRequired[payload];
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

export const {login, logout, loginWithPasskey, setPendingPasskey, setSilentPasskeyLogin, forgetPasskey, forgetRetiredPasskey, dismissPasskeyUpgrade, requirePasskeyRenewal, completePasskeyRenewal} = authSlice.actions;

export const authReducer = authSlice.reducer;
