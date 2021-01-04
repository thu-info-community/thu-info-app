export type sourceTag = "JWGG" | "KYTZ" | "BGTZ" | "HB";

export class newsSlice {
	constructor(
		readonly name: string,
		readonly url: string,
		readonly date: string,
		readonly source: string,
		readonly channel: sourceTag,
	) {}
}
