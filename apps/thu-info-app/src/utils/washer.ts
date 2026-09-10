import {getStr} from "./i18n";

export type WasherProvider = "jieli" | "haile" | "xiaolan";

export interface WasherBuilding {
	name: string;
	id: string;
	provider: WasherProvider;
}

export interface WasherBuildingGroup {
	name: string;
	buildings: WasherBuilding[];
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

const HAIER_SEARCH_POSITIONS = [
	{lng: 116.32697, lat: 40.00281},
	{lng: 116.3424247, lat: 40.0313472},
];

function compareNames(a: {name: string}, b: {name: string}): number {
	return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
}

export async function fetchJieliBuildings(signal: AbortSignal): Promise<WasherBuildingGroup[]> {
	const response = await fetch("https://api.cleverschool.cn/washapi4/device/tower", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: "{}",
		signal,
	});
	const result = await response.json();
	if (result.errorCode != null) throw new Error(result.errorMsg);
	const groups: WasherBuildingGroup[] = [
		{name: getStr("ziJingDorm"), buildings: []},
		{name: getStr("nanQuDorm"), buildings: []},
		{name: getStr("shuangQingDorm"), buildings: []},
		{name: getStr("otherDorm"), buildings: []},
	];
	for (const b of result.data) {
		if (b.value === "0") continue;
		const group = b.text.includes("紫荆") ? 0 : b.text.includes("南区") ? 1 : b.text.includes("双清") ? 2 : 3;
		groups[group].buildings.push({name: b.text, id: b.value, provider: "jieli"});
	}
	for (const group of groups) {
		group.buildings.sort((a, b) => {
			const aNumber = a.name.match(/\d+/);
			const bNumber = b.name.match(/\d+/);
			if (aNumber && bNumber) {
				const difference = parseInt(aNumber[0], 10) - parseInt(bNumber[0], 10);
				if (difference !== 0) return difference;
			}
			return compareNames(a, b);
		});
	}
	return groups;
}

export async function fetchHaileBuildings(signal: AbortSignal): Promise<WasherBuildingGroup[]> {
	const responses = await Promise.all(HAIER_SEARCH_POSITIONS.map((position) =>
		fetch("https://yshz-user.haier-ioc.com/position/nearPosition", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({...position, page: 1, pageSize: 50}),
			signal,
		}).then((response) => response.json()),
	));
	const buildingsById = new Map<string, WasherBuilding>();
	for (const response of responses) {
		if (response.code !== 0) continue;
		for (const b of response.data.items) {
			if (b.name.includes("清华") && !b.name.includes("中学")) {
				const id = String(b.id);
				buildingsById.set(id, {name: b.name, id, provider: "haile"});
			}
		}
	}
	return [{name: getStr("haiLeShengHuo"), buildings: [...buildingsById.values()].sort(compareNames)}];
}

export async function fetchJieliFloors(buildingId: string, signal: AbortSignal): Promise<WasherFloor[]> {
	const statusPromise = fetch("https://api.cleverschool.cn/washapi4/device/status", {
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({towerKey: buildingId}),
		signal,
	}).then((response) => response.json());
	const locationPromise = fetch(
		"https://app.cs.tsinghua.edu.cn/Api/JieliWashers?building=" + encodeURIComponent(buildingId),
		{signal},
	).then((response) => response.json());
	const [statusResult, locationResult] = await Promise.allSettled([statusPromise, locationPromise]);
	if (statusResult.status === "rejected") throw statusResult.reason;
	const locations = locationResult.status === "fulfilled" ? locationResult.value : {};
	const result = statusResult.value;
	if (result.errorCode != null) throw new Error(result.errorMsg);
	const floors: Record<string, Washer[]> = Object.create(null);
	for (const item of result.data) {
		const statusParts: string[] = item.status.split(" ");
		let status: WasherStatus = "error";
		let updateTime: Date | undefined;
		let eta = 0;
		for (const [index, part] of statusParts.entries()) {
			if (part.includes("剩余")) {
				eta = parseInt(part.match(/\d+/)![0], 10);
			} else if (part.includes("更新")) {
				updateTime = new Date(part.split(":")[1] + " " + statusParts[index + 1]);
			} else if (part.includes("待机")) {
				status = "idle";
			} else if (part.includes("工作") || part.includes("运转")) {
				status = "working";
			}
		}
		const [type, name] = item.macUnionCode.split(" ");
		const washers = floors[item.floorName] ?? [];
		washers.push({
			type, name, floor: item.floorName, status, eta,
			updateTime: updateTime ?? new Date(0),
			location: locations[name] ?? undefined,
		});
		floors[item.floorName] = washers;
	}
	return Object.entries(floors).map(([name, washers]) => ({
		name, washers: washers.sort(compareNames), favourite: false,
	}));
}

export async function fetchHaileFloors(buildingId: string, signal: AbortSignal): Promise<WasherFloor[]> {
	const floor: WasherFloor = {name: "海乐生活", washers: [], favourite: false};
	const types = {"00": "洗衣机", "01": "洗鞋机", "02": "烘干机"};
	const statuses: Record<number, WasherStatus> = {1: "idle", 2: "working", 3: "error"};
	for (const categoryCode of ["00", "01", "02"] as const) {
		const response = await fetch("https://yshz-user.haier-ioc.com/position/deviceDetailPage", {
			method: "POST",
			headers: {"Content-Type": "application/json"},
			body: JSON.stringify({positionId: buildingId, categoryCode, page: 1, floorCode: "", pageSize: 100}),
			signal,
		});
		const detail = await response.json();
		if (detail.code !== 0) continue;
		for (const washer of detail.data.items) {
			floor.washers.push({
				type: types[categoryCode], name: washer.name, floor: floor.name,
				status: statuses[washer.state] ?? "unknown", eta: -1, updateTime: new Date(),
			});
		}
	}
	floor.washers.sort(compareNames);
	return [floor];
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
