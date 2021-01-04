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
	posX: number;
	posY: number;
}

export interface LibrarySeat extends Library {
	type: number;
	hasSocket: boolean;
	lcObjId: string;
}

export const weightedValidityAndId = (lib: LibraryBase) =>
	(lib.valid ? 0 : 1000) + lib.id;

export const byId = (a: LibraryBase, b: LibraryBase) =>
	Number(a.id) - Number(b.id);

export interface LibBookRecord {
	id: string;
	pos: string;
	time: string;
	status: string;
	delId: string | undefined;
}
