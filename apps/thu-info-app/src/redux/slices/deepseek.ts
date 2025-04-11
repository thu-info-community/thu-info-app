import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import type {Conversation} from "../../ui/home/deepseek.tsx";

export interface DeepseekState {
	history: Conversation[];
}

const initialState: DeepseekState = {
	history: [],
};

export const defaultDeepseek = initialState;

export const deepseekSlice = createSlice({
	name: "deepseek",
	initialState,
	reducers: {
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

export const {deepseekUpdateHistory, deepseekClear, deepseekDeleteConversation} = deepseekSlice.actions;

export const deepseekReducer = deepseekSlice.reducer;
