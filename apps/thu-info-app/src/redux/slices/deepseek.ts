import {createSlice} from "@reduxjs/toolkit";
import type {Conversation} from "../../agent/types";

export interface DeepseekState {
	history: Conversation[];
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
		deepseekInvalidateNews: (state) => {
			state.newsRevision = (state.newsRevision ?? 0) + 1;
		},
		deepseekMigrationComplete: (state) => {
			state.history = [];
		},
		deepseekClear: (state: DeepseekState) => {
			state.history = [];
		},
	},
});

export const {
	deepseekClear,
	deepseekMigrationComplete,
	deepseekInvalidateNews,
} = deepseekSlice.actions;

export const deepseekReducer = deepseekSlice.reducer;
