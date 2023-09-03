export interface LibraryBase {
    id: number;
    zhName: string;
    zhNameTrace: string;
    enName: string;
    enNameTrace: string;
    valid: boolean;
}

export type Library = LibraryBase;

export type LibraryFloor = LibraryBase;

export interface LibraryDate {
    day: string;         // yyyy-MM-dd
    startTime: string;   // HH:mm
    endTime: string;     // HH:mm
    segmentId: number;
    today: boolean;
}

export interface LibrarySection extends Library {
    total: number;      // the total number of seats in the section
    available: number;  // the number of seats available in the section
    posX: number;       // the X coordinate of the section on the section map
    posY: number;       // the Y coordinate of the section on the section map
}

export type SocketStatus = "available" | "unavailable" | "unknown";

export interface LibrarySeat extends Library {
    type: number;  // the meaning of type is currently unknown, and is supposed to be only for internal use
    status: SocketStatus | undefined;  // the status of the socket
}

export const weightedValidityAndId = (lib: LibraryBase) =>
    (lib.valid ? 0 : 1000) + lib.id;

export const byId = (a: LibraryBase, b: LibraryBase) =>
    Number(a.id) - Number(b.id);

export interface LibBookRecord {
    id: string;
    pos: string;
    time: string;
    status: string;
    delId: string | undefined;
}

export interface LibRoom {
    devId: number;
    devName: string;
    minReserveTime: number;
}

export interface LibRoomInfo {
    kindId: number;
    kindName: string;
    rooms: LibRoom[];
}

export interface LibRoomUsage {
    id: number;
    start: Date;
    end: Date;
    title: string;
    owner: string;
    ownerId: string;
}

export interface LibRoomRes {
    devId: number;
    devName: string;
    kindId: number;
    kindName: string;
    labId: number;
    labName: string;
    roomId: number;
    roomName: string;
    limit: number;
    maxMinute: number;
    minMinute: number;
    cancelMinute: number;
    maxUser: number;
    minUser: number;
    openStart: string | null;  // HH:mm
    openEnd: string | null;  // HH:mm
    usage: LibRoomUsage[];
}

export interface LibFuzzySearchResult {
    id: number;
    label: string;
    department: string;
}

export interface LibRoomBookRecord {
    uuid: string;
    rsvId: number;
    owner: string;
    ownerId: string;
    date: string;  // yyyyMMdd
    begin: Date;
    end: Date;
    devName: string;
    kindName: string;
    members: {name: string; userId: string}[];
}
