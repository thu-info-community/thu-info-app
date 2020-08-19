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
