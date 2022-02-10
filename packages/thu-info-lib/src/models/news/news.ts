export type SourceTag = "LM_BGTG" | "LM_ZYGG" | "LM_YQFKZT" | "LM_JWGG" | "LM_KYTZ" | "LM_HB" | "LM_XJ_XTWBGTZ" | "LM_XSBGGG" | "LM_TTGGG" | "LM_JYGG" | "LM_XJ_XSSQDT" | "LM_BYJYXX" | "LM_JYZPXX" | "LM_XJ_GJZZSXRZ"

export interface NewsSlice {
    readonly name: string;
    readonly url: string;
    readonly date: string;
    readonly source: string;
    readonly topped: boolean;
    readonly channel: SourceTag;
}
