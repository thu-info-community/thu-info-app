export interface CardTransaction {
    id: string;
    summary: string;
    timestamp: Date;
    balance: number;
    amount: number;
    address: string;
    name: string | undefined;
    txName: string;
}

export enum CardTransactionType {
    Any = -1,
    Consumption = 1,
    Recharge = 2,
    Subsidy = 3,
}
