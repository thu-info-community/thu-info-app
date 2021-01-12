import {Schedule} from "../../models/schedule/schedule";

export interface Schedules {
	baseSchedule: Schedule[];
	cache: string;
	refreshing: boolean;
	shortenMap: {[key: string]: string};
}
