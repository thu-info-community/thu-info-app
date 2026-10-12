import type {WasherFavourite} from "../../utils/washer";

// Persistence version 7: replace name-id-floor strings with provider-aware objects.
// This runs once on upgrade, before the UI receives the persisted configuration.
export function migrateWasherFavourites(value: unknown): WasherFavourite[] {
	if (!Array.isArray(value)) return [];
	const favourites = new Map<string, WasherFavourite>();
	for (const entry of value) {
		let favourite: WasherFavourite;
		if (typeof entry === "string") {
			const match = entry.match(/^(.+)-([^-]+)-([^-]+)$/);
			if (!match) continue;
			const [, name, id, roomId] = match;
			favourite = {
				building: {name, id, provider: roomId === "海乐生活" ? "haile" : "jieli"},
				roomId,
			};
		} else if (entry && typeof entry === "object" && entry.building &&
			["jieli", "haile", "xiaolan"].includes(entry.building.provider) &&
			[entry.building.name, entry.building.id, entry.roomId].every(
				(field) => typeof field === "string" && field.length > 0,
			)) {
			favourite = entry;
		} else {
			continue;
		}
		const {building, roomId} = favourite;
		favourites.set(JSON.stringify([building.provider, building.id, roomId]), favourite);
	}
	return [...favourites.values()];
}
