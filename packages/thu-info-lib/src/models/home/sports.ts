export interface SportsResource {
    resId: string;            // a string representing the ID of the field
    bookId?: string;          // a string representing the ID of the order related to the resource, or `undefined` if no order related to the resource has been made
    timeSession: string;      // a string representing the time session, e.g. 5:00-6:00
    fieldName: string;        // a string representing the name of the field
    overlaySize: number;      // a number
    canNetBook: boolean;      // a boolean
    cost?: number;            // a number indicating the cost of the resource
    locked?: boolean;         // a boolean
    userType?: string;        // a string representing the type of user of this resource, or `undefined` if the resource is not occupied
    paymentStatus?: boolean;  // a boolean representing whether the resource has been paid, or `undefined` if the resource is not occupied
}

export interface SportsResourcesInfo {
    count: number;              // a number representing the maximum number of fields that the user can reserve
    init: number;               // a number. If it is less than or equal to zero, then reservation is not available at the moment; else, if count is equal to zero, it represents the number of unpaid orders of the current user
    phone: string | undefined;  // a string representing the phone number of the user, or `undefined` if the user has never configured a phone number
    data: SportsResource[];
}

export interface SportsIdInfo {
    name: string;
    gymId: string;
    itemId: string;
}

export interface SportsReservationRecord {
    name: string;                // a string representing the name of the gym
    field: string;               // a string representing the name of the reserved field
    time: string;                // a string representing the time period of the reservation
    price: string;               // a string representing the price of the reservation
    bookId: string | undefined;  // a string representing the ID of the booking, useful for cancelling, or undefined if the reservation is not cancellable
}
