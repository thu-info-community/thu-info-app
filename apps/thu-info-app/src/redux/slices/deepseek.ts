import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import type {Conversation} from "../../agent/types";

export interface DeepseekState {
	history: Conversation[];
	agentMigrated?: boolean;
	newsRevision?: number;
}

const initialState: DeepseekState = {
	history: [],
};

export const defaultDeepseek = initialState;

export const deepseekSlice = createSlice({
	name: "deepseek",
	initialState,
	reducers: {
		deepseekInvalidateNews: (state) => { state.newsRevision = (state.newsRevision ?? 0) + 1; },
		deepseekMigrationComplete: (state) => {
			state.history = [];
			state.agentMigrated = true;
		},
		deepseekUpdateHistory: (
			state,
			{payload}: PayloadAction<Conversation>,
		) => {
			const index = state.history.findIndex(
				(conversation) => conversation.id === payload.id,
			);
			if (index >= 0) {
				state.history[index] = payload;
			} else {
				state.history.splice(0, 0, payload);
			}
		},
		deepseekDeleteConversation: (
			state,
			{payload}: PayloadAction<Conversation>,
		) => {
			const index = state.history.findIndex(
				(conversation) => conversation.id === payload.id,
			);
			if (index >= 0) {
				state.history.splice(index, 1);
			}
		},
		deepseekClear: (state: DeepseekState) => {
			state.history = [];
		},
	},
});

export const {deepseekUpdateHistory, deepseekClear, deepseekDeleteConversation, deepseekMigrationComplete, deepseekInvalidateNews} = deepseekSlice.actions;

export const deepseekReducer = deepseekSlice.reducer;
