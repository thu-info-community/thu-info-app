import {Schedule} from "thu-info-lib/dist/models/schedule/schedule";

export interface Schedules {
	baseSchedule: Schedule[];
	cache: string;
	refreshing: boolean;
	shortenMap: {[key: string]: string | undefined};
	customCnt: number;
}

export const defaultSchedule: Schedules = {
	baseSchedule: [],
	cache: "",
	refreshing: false,
	shortenMap: {},
	customCnt: 1,
};
