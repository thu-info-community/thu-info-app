import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import type {Conversation} from "../../agent/types";
import type {CampusModelCache} from "../../utils/campusModel";

export interface DeepseekState {
	history: Conversation[];
	newsRevision?: number;
	modelCache?: CampusModelCache;
}

const initialState: DeepseekState = {
	history: [],
};

export const deepseekSlice = createSlice({
	name: "deepseek",
	initialState,
	reducers: {
		deepseekModelsReceived: (state, {payload}: PayloadAction<CampusModelCache>) => {
			state.modelCache = payload;
		},
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
	deepseekModelsReceived,
	deepseekClear,
	deepseekMigrationComplete,
	deepseekInvalidateNews,
} = deepseekSlice.actions;

export const deepseekReducer = deepseekSlice.reducer;
