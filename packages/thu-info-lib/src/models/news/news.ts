export type SourceTag = "LM_BGTG"|"LM_ZYGG"|"LM_YQFKZT"|"LM_ZJQRXXHZ"|"LM_JWGG"|"LM_KYTZ"|"LM_ZBZZ"|"LM_HB"

export interface NewsSlice {
    readonly name: string;
    readonly url: string;
    readonly date: string;
    readonly source: string;
    readonly channel: SourceTag;
}
