export interface LibraryNode {
	id: number;
	zhName: string;
	zhNameTrace: string;
	enName: string;
	enNameTrace: string;
	valid: boolean;
	children: LibraryNode[];
}
