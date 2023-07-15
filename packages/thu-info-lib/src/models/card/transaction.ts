export interface CardTransaction {
    summary: string;
    timestamp: Date;
    balance: number;
    amount: number;
}

export enum CardTransactionType {
    Any = -1,
    Consumption = 1,
    Recharge = 2,
    Subsidy = 3,
}
