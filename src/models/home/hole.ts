export enum FetchMode {
	NORMAL,
	ATTENTION,
	SEARCH,
}

export interface HoleTitleCard {
	likenum: number;
	pid: number;
	reply: number;
	tag: string;
	text: string;
	timestamp: number;
	type: string;
	url: string;
}
