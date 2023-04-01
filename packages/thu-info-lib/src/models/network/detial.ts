export interface Usage {
    readonly in: string;
    readonly out: string;
    readonly total: string;
    readonly onlineTime: string;
    readonly loginCount: string;
    readonly currentCost: string;
}

export interface Detial {
    readonly year: number;
    readonly month: number;
    readonly wirelessUsage: Usage;
    readonly wiredUsage: Usage;
    readonly monthlyCost: string;
}