import {Schedule} from "thu-info-lib/dist/models/schedule/schedule";

export interface Schedules {
	baseSchedule: Schedule[];
	shortenMap: {[key: string]: string | undefined};
	customCnt: number;
}

export const defaultSchedule: Schedules = {
	baseSchedule: [],
	shortenMap: {},
	customCnt: 1,
};
