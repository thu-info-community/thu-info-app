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

export interface HoleCommentCard {
	cid: number;
	timestamp: number;
	text: string;
	tag?: string;
	name: string;
	type: string;
	url: string;
}
