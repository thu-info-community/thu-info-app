import {createSlice} from "@reduxjs/toolkit";
import type {PayloadAction} from "@reduxjs/toolkit";
import {Announcement} from "thu-info-lib/dist/models/app/announcement";

export interface AppAnnouncement extends Announcement {
	read: boolean;
}

export interface AnnouncementState {
	announcements: AppAnnouncement[];
}

const initialState: AnnouncementState = {
	announcements: [],
};

export const defaultAnnouncement = initialState;

export const announcementSlice = createSlice({
	name: "announcement",
	initialState,
	reducers: {
		updateAnnouncements: (state, {payload}: PayloadAction<Announcement[]>) => {
			state.announcements = payload.map((a) => ({
				...a,
				read: state.announcements.some(({id, read}) => id === a.id && read),
			}));
		},
		toggleReadStatus: (state, {payload}: PayloadAction<number>) => {
			state.announcements
				.filter(({id}) => id === payload)
				.forEach((a) => (a.read = !a.read));
		},
	},
});

export const {updateAnnouncements, toggleReadStatus} =
	announcementSlice.actions;

export const announcementReducer = announcementSlice.reducer;
