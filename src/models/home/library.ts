export interface LibraryBase {
	id: number;
	zhName: string;
	zhNameTrace: string;
	enName: string;
	enNameTrace: string;
	valid: boolean;
}

export type Library = LibraryBase;

export interface LibraryFloor extends LibraryBase {
	parentId: number;
}

export interface LibraryDate {
	day: string;
	startTime: string;
	endTime: string;
	segmentId: number;
}

export interface LibrarySection extends Library {
	total: number;
	available: number;
}

export interface LibrarySeat extends Library {}
