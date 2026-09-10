import {getStr} from "./i18n";

export type WasherProvider = "jieli" | "haile" | "xiaolan";

export interface WasherBuilding {
	name: string;
	id: string;
	provider: WasherProvider;
}

export type WasherStatus = "idle" | "working" | "error" | "offline" | "standby" | "unknown";

export interface Washer {
	id?: string;
	type: string;
	name: string;
	floor: string;
	status: WasherStatus;
	eta: number;
	updateTime?: Date;
	estimatedCompleteTime?: Date;
	location?: string;
}

export interface WasherFloor {
	id?: string;
	name: string;
	washers: Washer[];
	favourite: boolean;
}

export interface WasherFavourite {
	building: WasherBuilding;
	roomId: string;
}

export function isWasherFavourite(favourite: WasherFavourite, building: WasherBuilding, roomId: string): boolean {
	return favourite.building.provider === building.provider &&
		favourite.building.id === building.id && favourite.roomId === roomId;
}

const XIAOLAN_URL = "https://wash-ltd-thu.aajax.top";
const XIAOLAN_ORGANIZATION = "67ce4044ba854c556508830e";

function object(value: unknown): Record<string, unknown> {
	return value !== null && typeof value === "object" && !Array.isArray(value)
		? value as Record<string, unknown> : {};
}

function label(value: unknown, fallback = ""): string {
	return typeof value === "string" && value.length > 0 ? value :
		typeof value === "number" ? String(value) : fallback;
}

function date(value: unknown): Date | undefined {
	if (typeof value !== "string" && typeof value !== "number") return undefined;
	if (value === "") return undefined;
	const result = new Date(value);
	return Number.isNaN(result.getTime()) ? undefined : result;
}

export function compareWasherNames(a: string, b: string): number {
	return a.localeCompare(b, "zh-CN", {numeric: true});
}

function xiaolanStatus(value: unknown): WasherStatus {
	const state = object(value);
	if (state.isOnline === 0 || state.isOnline === "0") return "offline";
	if (state.fault != null && state.fault !== 0 && state.fault !== "0" &&
		state.fault !== false && state.fault !== "") return "error";
	if (state.isOnline !== 1 && state.isOnline !== "1") return "unknown";
	switch (Number(state.runState)) {
		case 7: return "idle";
		case 5: return "working";
		case 1: return "standby";
		default: return "unknown";
	}
}

async function fetchXiaolan(path: string, signal: AbortSignal) {
	const response = await fetch(`${XIAOLAN_URL}${path}`, {signal});
	if (!response.ok) throw new Error(`HTTP ${response.status}`);
	const data = object(await response.json());
	const organization = object(data[XIAOLAN_ORGANIZATION]);
	if (!organization.buildings || typeof organization.buildings !== "object" ||
		Array.isArray(organization.buildings)) {
		throw new Error(getStr("loadFail"));
	}
	return {
		buildings: object(organization.buildings),
		fetchedAt: date(organization.fetchedAt),
	};
}

export async function fetchXiaolanBuildings(signal: AbortSignal): Promise<WasherBuilding[]> {
	const {buildings} = await fetchXiaolan("/buildings/list", signal);
	return Object.entries(buildings).map(([id, value]): WasherBuilding => {
		const building = object(value);
		return {
			id: label(building.buildingId, id),
			name: label(building.name, id),
			provider: "xiaolan",
		};
	}).sort((a, b) => compareWasherNames(a.name, b.name));
}

export async function fetchXiaolanFloors(buildingId: string, signal: AbortSignal) {
	const {buildings, fetchedAt} = await fetchXiaolan(`/buildings/${encodeURIComponent(buildingId)}`, signal);
	const building = object(buildings[buildingId]);
	if (!Array.isArray(building.facilities)) throw new Error(getStr("loadFail"));
	const types: Record<string, string> = {
		1: getStr("washerTypeWasher"),
		2: getStr("washerTypeDryer"),
		3: getStr("washerTypeWasherDryer"),
		4: getStr("washerTypeShoeWasher"),
	};
	const rooms = building.facilities.map((value) => {
		const facility = object(value);
		const store = object(facility.store);
		const detail = object(facility.storeDetail);
		const id = label(store.storeId, label(detail.storeId));
		if (!id || !Array.isArray(facility.devices)) throw new Error(getStr("loadFail"));
		const floor = label(store.floor);
		const name = label(detail.name, label(store.opStoreName, `${getStr("washerRoom")} ${floor || id}`));
		const washers = facility.devices.map((value): Washer => {
			const device = object(value);
			const deviceId = label(device.deviceId);
			if (!deviceId) throw new Error(getStr("loadFail"));
			return {
				id: deviceId,
				name: label(device.deviceCode, deviceId),
				type: types[label(device.type)] ?? getStr("washerTypeOther"),
				floor: name,
				status: xiaolanStatus(device.deviceState),
				eta: -1,
				updateTime: fetchedAt,
				estimatedCompleteTime: date(object(device.inUseBit).estimatedCompleteTime),
			};
		}).sort((a, b) => compareWasherNames(a.name, b.name));
		const room: WasherFloor = {id, name, washers, favourite: false};
		return {floor, room};
	});
	rooms.sort((a, b) => compareWasherNames(a.floor, b.floor) || compareWasherNames(a.room.name, b.room.name));
	return {floors: rooms.map(({room}) => room), fetchedAt};
}
