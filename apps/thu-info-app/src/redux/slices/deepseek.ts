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
		updateHistory: (state, {payload}: PayloadAction<Conversation>) => {
			const index = state.history.findIndex(conversation => conversation.id === payload.id);
			if (index >= 0) {
				state.history[index] = payload;
			} else {
				state.history.splice(0, 0, payload);
			}
		},
	},
});

export const {updateHistory} = deepseekSlice.actions;

export const deepseekReducer = deepseekSlice.reducer;
