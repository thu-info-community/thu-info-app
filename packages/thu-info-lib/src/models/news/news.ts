export type SourceTag = "JWGG" | "KYTZ" | "BGTZ" | "HB";

export interface NewsSlice {
    readonly name: string;
    readonly url: string;
    readonly date: string;
    readonly source: string;
    readonly channel: SourceTag;
}
