export interface SportsResource {
    resId: string;
    bookId?: string;
    timeSession: string;  // e.g. 5:00-6:00
    fieldName: string;
    overlaySize: number;
    canNetBook: boolean;
    cost?: number;
    locked?: boolean;
    userType?: string;
    paymentStatus?: boolean;
}
