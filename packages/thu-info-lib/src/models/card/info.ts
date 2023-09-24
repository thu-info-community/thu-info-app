export interface CardInfo {
    userId: string;
    userName: string;
    userNameEn: string;
    departmentName: string;
    departmentNameEn: string;
    departmentId: number;
    photoFileName: string;
    phoneNumber: string;
    userGender: string;

    // You need to register each year to keep it effective
    effectiveTimestamp: Date;

    // The card remains valid until you leave the school
    validTimestamp: Date;

    balance: number;
    cardId: string;
    cardStatus: string;
    lastTransactionTimestamp: Date;
    maxDailyTransactionAmount: number;
    maxOneTimeTransactionAmount: number;
}
