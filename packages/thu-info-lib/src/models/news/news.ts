export const channelTags = ["LM_BGTG", "LM_ZYGG", "LM_YQFKZT", "LM_JWGG", "LM_KYTZ", "LM_HB", "LM_XJ_XTWBGTZ", "LM_XSBGGG", "LM_TTGGG", "LM_JYGG", "LM_XJ_XSSQDT", "LM_BYJYXX", "LM_JYZPXX", "LM_XJ_GJZZSXRZ"] as const;

export type ChannelTag = typeof channelTags[number];

export interface NewsSlice {
    readonly name: string;
    readonly xxid: string;
    readonly url: string;
    readonly date: string;
    readonly source: string;
    readonly topped: boolean;
    readonly channel: ChannelTag;
}

export interface NewsSubscription {
    readonly channel?: string;
    readonly source?: string;
    readonly id: string;
    readonly title: string;
    readonly order: number;
}