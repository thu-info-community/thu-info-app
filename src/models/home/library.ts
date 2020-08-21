export interface LibraryBase {
	id: number;
	zhName: string;
	zhNameTrace: string;
	enName: string;
	enNameTrace: string;
	valid: boolean;
}

export type Library = LibraryBase;

export type LibraryFloor = LibraryBase;

export interface LibraryDate {
	day: string;
	startTime: string;
	endTime: string;
	segmentId: number;
	today: boolean;
}

export interface LibrarySection extends Library {
	total: number;
	available: number;
}

export interface LibrarySeat extends Library {
	type: number;
}

export const byId = (a: LibraryBase, b: LibraryBase) =>
	Number(a.id) - Number(b.id);
