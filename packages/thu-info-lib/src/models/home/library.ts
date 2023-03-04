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

export const validLibName = [
    "NORTH", "WEST", "LAW", "SOCIAL"
] as const;

export type LibName = typeof validLibName[number];

export interface LibRoomUsage {
    start: string;  // HH:mm
    end: string;  // HH:mm
    state: "doing" | "undo";
    title: string;
    // owner: string;  // hidden due to security reason
    // accno: string;  // hidden due to security reason
    occupy: boolean;
}

export interface LibRoomRes {
    id: string;
    name: string;
    loc: LibName;
    devId: number;
    devName: string;
    kindId: number;
    kindName: string;
    classId: number;
    className: string;
    labId: number;
    labName: string;
    roomId: number;
    roomName: string;
    buildingId: number;
    buildingName: string;
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
    id: string;
    label: string;
}

export interface LibRoomBookRecord {
    regDate: string;  // yyyy-MM-dd HH:mm
    over: boolean;
    status: string;
    name: string;
    category: string;
    owner: string;
    members: string;
    begin: string;  // MM-dd HH:mm
    end: string;  // MM-dd HH:mm
    description: string;
    rsvId: string | undefined;
}
