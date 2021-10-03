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

export interface SportsResourcesInfo {
    count: number;
    init: number;
    phone: string | undefined;
    data: SportsResource[];
}

export interface SportsIdInfo {
    name: string;
    gymId: string;
    itemId: string;
}

export interface SportsReservationRecord {
    name: string;
    field: string;
    time: string;
    price: string;
    bookId: string | undefined;
}
